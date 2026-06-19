# StackD Contracts

`StackdRegistry` — the on-chain backbone for StackD. It records each wallet's daily
build logs, streaks, and freezes on Base, so profiles, the Explore feed, and the
leaderboard become real and verifiable instead of per-device `localStorage`.

## Design

- **One build per UTC day** per wallet. The day is derived on-chain from
  `block.timestamp / 1 days`, matching the frontend's `todayUTC()`.
- **Payloads stay on IPFS.** A log stores the **IPFS CID** + category + day on-chain;
  the text/image content is pinned to IPFS (via Pinata, as the app already does).
  Cheap to write, fully verifiable.
- **Streaks** increment on consecutive days and reset after any gap > 1 day.
  `liveStreak()` applies decay on read (0 if more than one day has lapsed).
- **Streak Freeze.** A freeze is minted each time the streak crosses a new multiple
  of 10 (max 1 held). `activateFreeze()` covers the day immediately after your last
  entry, preserving the chain (it saves the streak, it does not increment it).
  > This fixes a bug in the old `localStorage` logic, where freeze entries were
  > excluded from the streak calculation and so never actually saved a streak.
- **Builder Score** = `totalLogs + liveStreak*3 + longestStreak*2` (same formula
  as the frontend), exposed as a view.
- **Enumeration + events.** A builder list and per-action events let the Explore
  feed and leaderboard be assembled off-chain (direct reads or a subgraph).
  Achievements (7/30/100/365-day, volume tiers, Early Builder via
  `registrationIndex`, Comeback Kid, Century Year) are all derivable from the
  on-chain state and `getLogs()` — no badge NFTs, no token economy.

## Develop

```bash
forge build      # compile (optimizer + via-IR enabled in foundry.toml)
forge test       # 17 tests, including streak/freeze edge cases + a fuzz test
forge test -vvv  # verbose traces
```

forge-std is vendored under `lib/`, so the project builds on a fresh clone with no
`forge install` step.

## Deploy

```bash
cp .env.example .env   # then fill in PRIVATE_KEY (and a key for verification)

# Base Sepolia (testnet)
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://sepolia.base.org \
  --broadcast --verify --etherscan-api-key "$BASESCAN_API_KEY"

# Base mainnet
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://mainnet.base.org \
  --broadcast --verify --etherscan-api-key "$BASESCAN_API_KEY"
```

After deploying, wire the address + ABI into the frontend (`src/lib/`) and swap the
`localStorage` reads/writes in `storage.ts` for `wagmi` `useReadContract` /
`useWriteContract` calls.

## Public interface (for the frontend)

| Function | Kind | Purpose |
|---|---|---|
| `logBuild(string cid, uint8 category)` | write | Log today's build (CID on IPFS, category 0–6) |
| `activateFreeze()` | write | Spend a freeze to cover today and save the streak |
| `getBuilder(address)` | view | streak/longest/total/lastDay/freeze/exists/firstLogAt/regIndex/score |
| `liveStreak(address)` | view | Current streak with decay applied |
| `builderScore(address)` | view | Builder Score |
| `canActivateFreeze(address)` | view | Whether a freeze is usable right now |
| `hasActedToday(address)` | view | Already logged/frozen today? |
| `getLogs(address)` / `getLogsPaged(address,offset,limit)` | view | Full / paged history |
| `getBuilderCount()` / `getBuilderAt(i)` / `getBuildersPaged(offset,limit)` | view | Enumerate builders |

Events: `BuildLogged`, `FreezeMinted`, `FreezeActivated`, `BuilderRegistered`.
