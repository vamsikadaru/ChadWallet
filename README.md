# ChadWallet

A premium, non-custodial Solana trading terminal. Sign in with Google, Apple, or email, get an embedded wallet instantly, and trade trending SPL tokens with live market data — no browser extension or seed phrase required.

**Live:** [my-chadwallet.vercel.app](https://my-chadwallet.vercel.app/)

## Features

- **Embedded wallet** — passwordless sign-in and a non-custodial Solana wallet via [Privy](https://privy.io) (Google / Apple / email / external wallets).
- **Live markets** — trending tokens, prices, market caps, and 24h moves powered by [BirdEye](https://birdeye.so), proxied server-side so the API key never ships to the client bundle.
- **Trading terminal** — real candlestick + volume charts ([lightweight-charts](https://www.tradingview.com/lightweight-charts/)) with a Price ⇄ MCap toggle, a persistent token rail, a docked Buy/Sell panel, live recent swaps, and real top-holders feeds. Y-axis formatting handles micro-cap prices correctly. Range switching shows a proper loading state while chart data reloads.
- **Swap any token** — buy/sell SPL tokens through [Jupiter v6](https://station.jup.ag/docs/apis/swap-api) with slippage control and price-impact estimates. Completed trades are logged to Supabase.
- **Live portfolio** — net worth, holdings, and value-weighted 24h change computed from your real on-chain balances, priced with live BirdEye quotes.
- **Profile & social** — a generated handle/avatar, editable name + bio, following/followers, and a "Follow top traders" rail backed by [Supabase](https://supabase.com).
- **Deposit & withdraw** — receive SOL via a QR code, or withdraw SOL to any address (10/25/50/Max) signed by the embedded wallet. Both screens have an X button to dismiss and return to the previous page.
- **Token search** — full Solana token search via BirdEye (`/` shortcut to focus), not limited to trending tokens.
- **Security** — Privy JWT authentication (`jose` + JWKS) enforced on all mutating API routes (trades, profile edits, follow/unfollow). IP-based sliding-window rate limiting on every endpoint. BirdEye API key is server-side only — the `/api/birdeye` proxy is the only path to market data. Alchemy RPC key is domain-allowlisted in the Alchemy dashboard.
- **Extras** — a live BTC/SOL/JUP majors ticker and a "blur balances" privacy toggle.

## Tech Stack

| Layer         | Choice                                              |
| ------------- | --------------------------------------------------- |
| Framework     | Next.js 16 (App Router) · React 19                  |
| Styling       | Tailwind CSS v4 · Framer Motion                     |
| Auth / Wallet | Privy (Solana embedded wallets)                     |
| Swaps         | Jupiter v6 quote + swap API                         |
| Market data   | BirdEye (via the `/api/birdeye` proxy)              |
| RPC           | Alchemy (Solana mainnet-beta)                       |
| Database      | Supabase (trades · profiles · follows)             |
| Charts        | lightweight-charts (candles) · recharts (net worth) |

## Getting Started

### 1. Install

```bash
npm install
```

### 2. Configure environment

Create `.env.local`:

```bash
# Privy — https://dashboard.privy.io
NEXT_PUBLIC_PRIVY_APP_ID=

# Solana RPC — https://alchemy.com
# Add your production domain + localhost to the Alchemy dashboard allowlist.
NEXT_PUBLIC_ALCHEMY_RPC_URL=

# BirdEye — https://birdeye.so
# Server-side only — do NOT prefix with NEXT_PUBLIC_.
BIRDEYE_API_KEY=

# Supabase — https://supabase.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

> If `BIRDEYE_API_KEY` is missing the `/api/birdeye` proxy returns a `fallback: true` error and market data won't load. The Alchemy RPC URL is intentionally public (`NEXT_PUBLIC_`) but restrict it by domain in the Alchemy dashboard so it can't be abused from other sites.

### 3. Set up the database

The app stores trades, profiles, and the follow graph in Supabase. Open your
project's **SQL Editor** and run [`supabase/setup.sql`](supabase/setup.sql) once
— it provisions all three tables with row-level-security policies and seeds the
"top traders" rail. Until it's applied, social features degrade gracefully and
follows won't persist.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command         | Description                |
| --------------- | -------------------------- |
| `npm run dev`   | Start the dev server       |
| `npm run build` | Production build           |
| `npm run start` | Serve the production build |
| `npm run lint`  | Run ESLint                 |

## Project Structure

```
src/
├── app/                  Routes
│   ├── page.tsx          Markets (landing page)
│   ├── trade/[address]   Trading terminal
│   ├── activity          Trade history
│   ├── profile           Profile + follow graph
│   ├── deposit           Receive SOL (QR)
│   ├── withdraw          Send SOL
│   └── api/              birdeye proxy · trades · profile · follow
├── components/           UI, trade, portfolio, trending, profile components
└── lib/                  Privy/Solana, BirdEye, holdings, Supabase, hooks, helpers
supabase/
└── setup.sql             One-shot schema + seed for trades/profiles/follows
```

## Deploy

Deploy on [Vercel](https://vercel.com/new): import the repo, add the environment
variables above, and ship. Pushes to `main` deploy to production automatically.
See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying)
for details.
