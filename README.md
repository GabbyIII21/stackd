# StackD

**Build something. Every day.**

StackD is an onchain builder journal. Log what you build each day, keep your
streak alive, and grow a verifiable public builder history on
[Base](https://base.org). Every log lives on-chain in the `StackdRegistry`
contract, so profiles, the Explore feed, and the leaderboard are real and
verifiable — not per-device `localStorage`.

## How it works

- **One build per UTC day** per wallet. The day is derived on-chain from
  `block.timestamp / 1 days`.
- **Logs are pinned to IPFS.** Each on-chain log stores an IPFS CID + category +
  day; the text/image content is pinned via [Pinata](https://pinata.cloud).
  Cheap to write, fully verifiable.
- **Streaks** increment on consecutive days and reset after any gap > 1 day.
- **Streak Freeze.** A freeze is minted each time your streak crosses a new
  multiple of 10 (max 1 held). Activating it covers the day after your last
  entry, preserving the chain.
- **Builder Score** = `totalLogs + liveStreak×3 + longestStreak×2`.
- **Achievements** (7/30/100/365-day streaks, volume tiers, Early Builder,
  Comeback Kid, Century Year) are all derived from on-chain state — no badge
  NFTs, no token economy.

## Features

- **Dashboard** — log today's build (category + notes + optional image), track
  your streak, freeze, and a contribution heatmap.
- **Leaderboard** — builders ranked by Builder Score, assembled from on-chain
  events.
- **Explore** — a public feed of recent builds across all wallets.
- **Profiles** — `/profile/$address`, a verifiable build history for any wallet.
- **Achievements** — unlockable milestones derived from on-chain activity.
- **Weekly digest** — a summary of your recent building.

## Tech stack

- **[TanStack Start](https://tanstack.com/start)** (file-based routing, SSR) +
  **React 19**
- **[wagmi](https://wagmi.sh) / [viem](https://viem.sh)** +
  **[OnchainKit](https://onchainkit.xyz)** for wallet + Base interactions
- **[Tailwind CSS v4](https://tailwindcss.com)** + **[shadcn/ui](https://ui.shadcn.com)**
- **[Foundry](https://getfoundry.sh)** for the `StackdRegistry` smart contract
- **[Pinata](https://pinata.cloud)** for IPFS pinning
- **[Vercel](https://vercel.com)** for hosting (via the Nitro Vercel preset)
- Bundled with **[Vite](https://vite.dev)**, package-managed with **[Bun](https://bun.sh)**

## Getting started

```bash
bun install
cp .env.example .env   # then fill in the values (see below)
bun run dev            # start the dev server
```

Other scripts:

```bash
bun run build      # production build (emits Vercel Build Output)
bun run preview    # preview the production build
bun run lint       # eslint
bun run format     # prettier
```

## Environment variables

Copy `.env.example` to `.env` and fill in the values. See `.env.example` for the
full annotated list. Key ones:

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_STACKD_REGISTRY_ADDRESS` | optional | `StackdRegistry` address (defaults to the committed Base Mainnet deploy). |
| `PINATA_JWT` | required for writes | Pins logs to IPFS. Reads (leaderboard, profiles, Explore, connecting a wallet) work without it; only "Log Today" and "Activate Freeze" need it. |
| `VITE_BUILDER_CODE` | optional | Base [Builder Code](https://base.dev) (ERC-8021) for transaction attribution + referral fees. Empty = no attribution. |
| `DEPLOYER_PRIVATE_KEY` | contracts only | Deployer key for the Foundry deploy script. |

## Smart contract

The on-chain backbone lives in [`contracts/`](contracts/) — see
[contracts/README.md](contracts/README.md) for the design, the streak/freeze
semantics, and deploy instructions.

```bash
cd contracts
forge build      # compile
forge test       # run the test suite (streak/freeze edge cases + fuzz)
```

`StackdRegistry` is deployed on **Base Mainnet** (chain 8453) at
`0x27A114c7C0e0d0ef97538407C447D7601c940d4D`.

## Project structure

```
src/
  routes/        file-based routes (dashboard, leaderboard, explore, profile, achievements)
  components/    UI — Nav, Heatmap, StreakFlame, LogImage, WeeklyDigest, ui/ (shadcn)
  hooks/         use-registry, use-live-profile, use-mounted, use-mobile
  lib/           contract ABI, wagmi config, IPFS/Pinata, achievements, categories
contracts/       Foundry project for StackdRegistry
```
