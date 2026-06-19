// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {StackdRegistry} from "../src/StackdRegistry.sol";

contract StackdRegistryTest is Test {
    StackdRegistry reg;

    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    uint256 constant DAY = 1 days;

    function setUp() public {
        reg = new StackdRegistry();
        // Start at a stable, mid-day timestamp on a known day so day math is clean.
        vm.warp(1000 * DAY + 12 hours);
    }

    // Warp to noon of `dayNumber` (UTC day index since epoch).
    function _warpToDay(uint32 dayNumber) internal {
        vm.warp(uint256(dayNumber) * DAY + 12 hours);
    }

    function _today() internal view returns (uint32) {
        return uint32(block.timestamp / DAY);
    }

    // ── Logging basics ───────────────────────────────────────────────────────

    function test_FirstLog_SetsStreakAndRegisters() public {
        vm.prank(alice);
        reg.logBuild("cid-1", 2);

        (
            uint32 cur,
            uint32 longest,
            uint32 total,
            uint32 lastDay,
            ,
            bool exists,
            uint64 firstLogAt,
            uint32 regIndex,
            uint256 score
        ) = reg.getBuilder(alice);

        assertEq(cur, 1);
        assertEq(longest, 1);
        assertEq(total, 1);
        assertEq(lastDay, _today());
        assertTrue(exists);
        assertEq(firstLogAt, block.timestamp);
        assertEq(regIndex, 0);
        assertEq(score, 1 + 1 * 3 + 1 * 2); // total + cur*3 + longest*2
        assertEq(reg.getBuilderCount(), 1);
        assertEq(reg.getBuilderAt(0), alice);
    }

    function test_RevertWhen_LogTwiceSameDay() public {
        vm.startPrank(alice);
        reg.logBuild("cid-1", 0);
        vm.expectRevert(StackdRegistry.AlreadyLoggedToday.selector);
        reg.logBuild("cid-2", 0);
        vm.stopPrank();
    }

    function test_RevertWhen_EmptyCid() public {
        vm.prank(alice);
        vm.expectRevert(StackdRegistry.EmptyCid.selector);
        reg.logBuild("", 0);
    }

    function test_RevertWhen_InvalidCategory() public {
        vm.prank(alice);
        vm.expectRevert(StackdRegistry.InvalidCategory.selector);
        reg.logBuild("cid", 7); // valid is 0..6
    }

    // ── Streak math ──────────────────────────────────────────────────────────

    function test_ConsecutiveDays_IncrementStreak() public {
        uint32 d0 = _today();
        vm.prank(alice);
        reg.logBuild("c0", 0);

        _warpToDay(d0 + 1);
        vm.prank(alice);
        reg.logBuild("c1", 0);

        _warpToDay(d0 + 2);
        vm.prank(alice);
        reg.logBuild("c2", 0);

        (uint32 cur, uint32 longest,,,,,,,) = reg.getBuilder(alice);
        assertEq(cur, 3);
        assertEq(longest, 3);
    }

    function test_GapResetsStreak_ButKeepsLongest() public {
        uint32 d0 = _today();
        vm.prank(alice);
        reg.logBuild("c0", 0);
        _warpToDay(d0 + 1);
        vm.prank(alice);
        reg.logBuild("c1", 0); // streak 2

        // Skip d0+2 entirely; log on d0+3 -> gap 2 -> reset.
        _warpToDay(d0 + 3);
        vm.prank(alice);
        reg.logBuild("c3", 0);

        (uint32 cur, uint32 longest,,,,,,,) = reg.getBuilder(alice);
        assertEq(cur, 1);
        assertEq(longest, 2);
    }

    function test_LiveStreak_DecaysAfterMissedDay() public {
        uint32 d0 = _today();
        vm.prank(alice);
        reg.logBuild("c0", 0);
        _warpToDay(d0 + 1);
        vm.prank(alice);
        reg.logBuild("c1", 0); // streak 2

        // Same day: live == stored.
        assertEq(reg.liveStreak(alice), 2);
        // Next day (gap 1): still alive.
        _warpToDay(d0 + 2);
        assertEq(reg.liveStreak(alice), 2);
        // Two days later (gap 2): decayed to 0.
        _warpToDay(d0 + 3);
        assertEq(reg.liveStreak(alice), 0);
    }

    // ── Freeze ───────────────────────────────────────────────────────────────

    function test_FreezeMintedAtTenDayStreak() public {
        uint32 d0 = _today();
        for (uint32 i = 0; i < 10; i++) {
            _warpToDay(d0 + i);
            vm.prank(alice);
            reg.logBuild("c", 0);
        }
        (,,,, bool freezeAvailable,,,,) = reg.getBuilder(alice);
        assertTrue(freezeAvailable);
    }

    function test_FreezeSavesStreak() public {
        uint32 d0 = _today();
        for (uint32 i = 0; i < 10; i++) {
            _warpToDay(d0 + i);
            vm.prank(alice);
            reg.logBuild("c", 0);
        }
        // Streak is 10, freeze available, last log day = d0+9. A freeze can't be
        // activated on the same day you logged — only the day after.
        assertFalse(reg.canActivateFreeze(alice));

        // Move to the day after last log (d0+10) without logging, activate freeze.
        _warpToDay(d0 + 10);
        assertTrue(reg.canActivateFreeze(alice));
        vm.prank(alice);
        reg.activateFreeze();

        (,,,, bool freezeAvailable,,,,) = reg.getBuilder(alice);
        assertFalse(freezeAvailable);
        assertEq(reg.liveStreak(alice), 10); // preserved, not incremented

        // Next day, a real log continues the chain.
        _warpToDay(d0 + 11);
        vm.prank(alice);
        reg.logBuild("c", 0);
        assertEq(reg.liveStreak(alice), 11);
    }

    function test_RevertWhen_FreezeWithoutBalance() public {
        vm.prank(alice);
        reg.logBuild("c", 0);
        _warpToDay(_today() + 1);
        vm.prank(alice);
        vm.expectRevert(StackdRegistry.NoFreezeAvailable.selector);
        reg.activateFreeze();
    }

    function test_RevertWhen_FreezeNotApplicable() public {
        uint32 d0 = _today();
        for (uint32 i = 0; i < 10; i++) {
            _warpToDay(d0 + i);
            vm.prank(alice);
            reg.logBuild("c", 0);
        }
        // Jump 2 days past last log -> freeze no longer applicable (chain already broken).
        _warpToDay(d0 + 11);
        assertFalse(reg.canActivateFreeze(alice));
        vm.prank(alice);
        vm.expectRevert(StackdRegistry.FreezeNotApplicable.selector);
        reg.activateFreeze();
    }

    function test_FreezeOnlyOneHeldAtATime() public {
        uint32 d0 = _today();
        // Reach a 20-day streak without spending the freeze minted at 10.
        for (uint32 i = 0; i < 20; i++) {
            _warpToDay(d0 + i);
            vm.prank(alice);
            reg.logBuild("c", 0);
        }
        // Still only one freeze available (cap 1), but milestone advanced to 20.
        (,,,, bool freezeAvailable,,,,) = reg.getBuilder(alice);
        assertTrue(freezeAvailable);
    }

    // ── Logs & enumeration ───────────────────────────────────────────────────

    function test_GetLogs_ReturnsHistoryIncludingFreeze() public {
        uint32 d0 = _today();
        for (uint32 i = 0; i < 10; i++) {
            _warpToDay(d0 + i);
            vm.prank(alice);
            reg.logBuild("c", uint8(i % 7));
        }
        _warpToDay(d0 + 10);
        vm.prank(alice);
        reg.activateFreeze();

        StackdRegistry.Log[] memory all = reg.getLogs(alice);
        assertEq(all.length, 11);
        assertFalse(all[0].isFreeze);
        assertTrue(all[10].isFreeze);
        assertEq(all[10].cid, "");
        assertEq(reg.getLogCount(alice), 11);
    }

    function test_Pagination() public {
        uint32 d0 = _today();
        for (uint32 i = 0; i < 5; i++) {
            _warpToDay(d0 + i);
            vm.prank(alice);
            reg.logBuild("c", 0);
        }
        StackdRegistry.Log[] memory page = reg.getLogsPaged(alice, 1, 2);
        assertEq(page.length, 2);
        assertEq(page[0].day, d0 + 1);
        assertEq(page[1].day, d0 + 2);

        StackdRegistry.Log[] memory tail = reg.getLogsPaged(alice, 4, 10);
        assertEq(tail.length, 1);

        StackdRegistry.Log[] memory empty = reg.getLogsPaged(alice, 99, 10);
        assertEq(empty.length, 0);
    }

    function test_RegistrationOrder() public {
        vm.prank(alice);
        reg.logBuild("a", 0);
        vm.prank(bob);
        reg.logBuild("b", 0);

        (,,,,,,, uint32 aliceIdx,) = reg.getBuilder(alice);
        (,,,,,,, uint32 bobIdx,) = reg.getBuilder(bob);
        assertEq(aliceIdx, 0);
        assertEq(bobIdx, 1);
        assertEq(reg.getBuilderCount(), 2);

        address[] memory page = reg.getBuildersPaged(0, 10);
        assertEq(page.length, 2);
        assertEq(page[0], alice);
        assertEq(page[1], bob);
    }

    function test_BuilderScoreFormula() public {
        uint32 d0 = _today();
        for (uint32 i = 0; i < 3; i++) {
            _warpToDay(d0 + i);
            vm.prank(alice);
            reg.logBuild("c", 0);
        }
        // total 3, current 3, longest 3 -> 3 + 9 + 6 = 18
        assertEq(reg.builderScore(alice), 18);
    }

    // ── Fuzz ─────────────────────────────────────────────────────────────────

    function testFuzz_ConsecutiveLogsBuildStreak(uint8 n) public {
        uint256 days_ = bound(uint256(n), 1, 60);
        uint32 d0 = _today();
        for (uint32 i = 0; i < days_; i++) {
            _warpToDay(d0 + i);
            vm.prank(alice);
            reg.logBuild("c", 0);
        }
        assertEq(reg.liveStreak(alice), uint32(days_));
        (, uint32 longest, uint32 total,,,,,,) = reg.getBuilder(alice);
        assertEq(longest, uint32(days_));
        assertEq(total, uint32(days_));
    }
}
