// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title StackdRegistry
/// @notice On-chain registry of daily builder logs for StackD. Each wallet logs at most
///         one build per UTC day. A log stores its content/image as an IPFS CID (the
///         payload stays off-chain on IPFS); the chain holds the verifiable streak state,
///         category, and day. Streak Freezes let a builder cover a single missed day so an
///         unbroken streak survives.
/// @dev    UTC days are derived from `block.timestamp / 1 days`, which aligns exactly with
///         calendar UTC day boundaries — matching the frontend's `todayUTC()` logic.
contract StackdRegistry {
    // ── Errors ──────────────────────────────────────────────────────────────
    error EmptyCid();
    error InvalidCategory();
    error AlreadyLoggedToday();
    error NoFreezeAvailable();
    error FreezeNotApplicable();
    error NoHistory();

    // ── Constants ───────────────────────────────────────────────────────────
    /// @notice Number of distinct build categories (mirrors CATEGORIES in the frontend).
    uint8 public constant CATEGORY_COUNT = 7;
    /// @notice A freeze is minted each time the current streak crosses a new multiple of this.
    uint32 public constant FREEZE_MILESTONE_STEP = 10;

    // ── Types ───────────────────────────────────────────────────────────────
    struct Log {
        uint32 day; // UTC day number (block.timestamp / 1 days)
        uint8 category; // index into CATEGORIES; 0..CATEGORY_COUNT-1
        bool isFreeze; // true when this entry is a freeze-covered day (no build content)
        uint64 timestamp; // block.timestamp at submission
        uint32 streak; // current streak immediately after this entry
        string cid; // IPFS CID of the log payload ("" for freeze entries)
    }

    struct Builder {
        uint32 currentStreak; // stored streak; read live via liveStreak() for decay
        uint32 longestStreak;
        uint32 totalLogs; // build logs only (excludes freeze entries)
        uint32 lastDay; // UTC day of the most recent entry (build or freeze)
        uint32 freezeMilestone; // highest streak milestone that has minted a freeze
        bool freezeAvailable; // at most one freeze held at a time
        bool exists;
        uint64 firstLogAt; // timestamp of the very first build log
        uint32 registrationIndex; // 0-based order this wallet first logged (for "Early Builder")
    }

    // ── Storage ─────────────────────────────────────────────────────────────
    mapping(address => Builder) private builders;
    mapping(address => Log[]) private logs;
    address[] private builderList;

    // ── Events ──────────────────────────────────────────────────────────────
    event BuildLogged(
        address indexed builder,
        uint32 indexed day,
        uint8 category,
        uint32 currentStreak,
        uint32 longestStreak,
        uint32 totalLogs,
        string cid
    );
    event FreezeMinted(address indexed builder, uint32 atStreak);
    event FreezeActivated(address indexed builder, uint32 indexed day, uint32 currentStreak);
    event BuilderRegistered(address indexed builder, uint32 registrationIndex);

    // ── Mutating ────────────────────────────────────────────────────────────

    /// @notice Log today's build. Reverts if already logged (or freeze-covered) today.
    /// @param cid IPFS CID of the log payload (text + optional image metadata).
    /// @param category Index into the frontend CATEGORIES list (0..6).
    function logBuild(string calldata cid, uint8 category) external {
        if (bytes(cid).length == 0) revert EmptyCid();
        if (category >= CATEGORY_COUNT) revert InvalidCategory();

        Builder storage b = builders[msg.sender];
        uint32 today = _today();

        // First-ever interaction: register for enumeration + ordering.
        if (!b.exists) {
            b.exists = true;
            b.registrationIndex = uint32(builderList.length);
            b.firstLogAt = uint64(block.timestamp);
            builderList.push(msg.sender);
            emit BuilderRegistered(msg.sender, b.registrationIndex);
        }

        if (b.lastDay == today) revert AlreadyLoggedToday();

        // Streak: consecutive UTC days continue; any gap > 1 resets to 1.
        uint32 nextStreak;
        if (b.lastDay == 0 && b.totalLogs == 0 && logs[msg.sender].length == 0) {
            nextStreak = 1;
        } else {
            nextStreak = (today - b.lastDay == 1) ? b.currentStreak + 1 : 1;
        }

        b.currentStreak = nextStreak;
        if (nextStreak > b.longestStreak) b.longestStreak = nextStreak;
        b.lastDay = today;
        b.totalLogs += 1;

        logs[msg.sender].push(
            Log({
                day: today,
                category: category,
                isFreeze: false,
                timestamp: uint64(block.timestamp),
                streak: nextStreak,
                cid: cid
            })
        );

        _maybeMintFreeze(b);

        emit BuildLogged(
            msg.sender, today, category, nextStreak, b.longestStreak, b.totalLogs, cid
        );
    }

    /// @notice Spend a held freeze to cover today, keeping an otherwise-broken streak alive.
    /// @dev    Valid only the day immediately after your last entry, before you've missed —
    ///         i.e. `today - lastDay == 1` and you haven't logged today. The streak is
    ///         preserved (not incremented): a freeze saves the chain, it isn't a build.
    function activateFreeze() external {
        Builder storage b = builders[msg.sender];
        if (!b.freezeAvailable) revert NoFreezeAvailable();
        if (b.lastDay == 0) revert NoHistory();

        uint32 today = _today();
        if (today - b.lastDay != 1) revert FreezeNotApplicable();

        b.freezeAvailable = false;
        b.lastDay = today; // today is now covered; streak unchanged

        logs[msg.sender].push(
            Log({
                day: today,
                category: 0,
                isFreeze: true,
                timestamp: uint64(block.timestamp),
                streak: b.currentStreak,
                cid: ""
            })
        );

        emit FreezeActivated(msg.sender, today, b.currentStreak);
    }

    // ── Views ───────────────────────────────────────────────────────────────

    /// @notice Current streak with decay applied: 0 if more than one day has passed
    ///         since the last entry, otherwise the stored streak.
    function liveStreak(address builder) public view returns (uint32) {
        Builder storage b = builders[builder];
        if (b.lastDay == 0) return 0;
        return (_today() - b.lastDay <= 1) ? b.currentStreak : 0;
    }

    /// @notice Builder Score = totalLogs + liveStreak*3 + longestStreak*2 (matches frontend).
    function builderScore(address builder) public view returns (uint256) {
        Builder storage b = builders[builder];
        return uint256(b.totalLogs) + uint256(liveStreak(builder)) * 3 + uint256(b.longestStreak) * 2;
    }

    /// @notice Whether `activateFreeze` would succeed for `builder` right now.
    function canActivateFreeze(address builder) external view returns (bool) {
        Builder storage b = builders[builder];
        return b.freezeAvailable && b.lastDay != 0 && (_today() - b.lastDay == 1);
    }

    /// @notice True if the builder has already logged or frozen the current UTC day.
    function hasActedToday(address builder) external view returns (bool) {
        Builder storage b = builders[builder];
        return b.lastDay != 0 && b.lastDay == _today();
    }

    function getBuilder(address builder)
        external
        view
        returns (
            uint32 currentStreak,
            uint32 longestStreak,
            uint32 totalLogs,
            uint32 lastDay,
            bool freezeAvailable,
            bool exists,
            uint64 firstLogAt,
            uint32 registrationIndex,
            uint256 score
        )
    {
        Builder storage b = builders[builder];
        return (
            liveStreak(builder),
            b.longestStreak,
            b.totalLogs,
            b.lastDay,
            b.freezeAvailable,
            b.exists,
            b.firstLogAt,
            b.registrationIndex,
            builderScore(builder)
        );
    }

    function getLogCount(address builder) external view returns (uint256) {
        return logs[builder].length;
    }

    /// @notice All entries (builds + freezes) for a builder, oldest first.
    function getLogs(address builder) external view returns (Log[] memory) {
        return logs[builder];
    }

    /// @notice Paginated entries to bound gas/response size for prolific builders.
    function getLogsPaged(address builder, uint256 offset, uint256 limit)
        external
        view
        returns (Log[] memory page)
    {
        Log[] storage all = logs[builder];
        if (offset >= all.length) return new Log[](0);
        uint256 end = offset + limit;
        if (end > all.length) end = all.length;
        page = new Log[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            page[i - offset] = all[i];
        }
    }

    /// @notice Number of wallets that have ever logged (for Explore/Leaderboard enumeration).
    function getBuilderCount() external view returns (uint256) {
        return builderList.length;
    }

    function getBuilderAt(uint256 index) external view returns (address) {
        return builderList[index];
    }

    /// @notice Slice of the builder list, for paginated off-chain leaderboard assembly.
    function getBuildersPaged(uint256 offset, uint256 limit)
        external
        view
        returns (address[] memory page)
    {
        if (offset >= builderList.length) return new address[](0);
        uint256 end = offset + limit;
        if (end > builderList.length) end = builderList.length;
        page = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            page[i - offset] = builderList[i];
        }
    }

    // ── Internal ────────────────────────────────────────────────────────────

    /// @dev Mint one freeze (cap 1) when the streak crosses a new multiple of the step.
    function _maybeMintFreeze(Builder storage b) private {
        uint32 milestone = (b.currentStreak / FREEZE_MILESTONE_STEP) * FREEZE_MILESTONE_STEP;
        if (milestone > b.freezeMilestone) {
            b.freezeMilestone = milestone;
            if (!b.freezeAvailable) {
                b.freezeAvailable = true;
                emit FreezeMinted(msg.sender, milestone);
            }
        }
    }

    function _today() private view returns (uint32) {
        return uint32(block.timestamp / 1 days);
    }
}
