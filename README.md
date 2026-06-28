# ChadWallet

A premium, non-custodial Solana trading terminal. Sign in with Google, Apple, or email, get an embedded wallet instantly, and trade trending SPL tokens with live market data — no browser extension or seed phrase required.

The UI layout and UX patterns are inspired by [fomo.family](https://fomo.family) — a Crypto trading terminal. The discovery panel, leaderboard rail, token list design, and overall desktop-first layout take direct visual reference from fomo.family's interface.

**Live:** [my-chadwallet.vercel.app](https://my-chadwallet.vercel.app/)

## Features

- **Embedded wallet** — passwordless sign-in and a non-custodial Solana wallet via [Privy](https://privy.io) (Google / Apple / email / external wallets).
- **Discovery panel** — collapsible left sidebar with Tokens (Trending / Watchlist / New / Gainers / Losers / Crypto), Leaderboard, Alerts, and Feed tabs. Serves as the primary market navigation hub.
- **Trading terminal** — real candlestick + volume charts ([lightweight-charts](https://www.tradingview.com/lightweight-charts/)) with a Price ⇄ MCap toggle, a docked Buy/Sell panel, live recent swaps, and real top-holders feeds. Y-axis formatting handles micro-cap prices correctly. Range switching shows a proper loading state while chart data reloads.
- **Swap any token** — buy/sell SPL tokens through [Jupiter v6](https://station.jup.ag/docs/apis/swap-api) with slippage control and price-impact estimates. Completed trades are logged to Supabase.
- **Live portfolio** — net worth, holdings, and value-weighted 24h change computed from your real on-chain balances, priced with live BirdEye quotes. Portfolio value is shown in the header.
- **Watchlist** — pin tokens for quick access in the Discovery panel's Watchlist filter.
- **Profile & social** — a generated handle/avatar, editable name + bio, following/followers, and a "Follow top traders" rail backed by [Supabase](https://supabase.com).
- **Deposit & withdraw** — receive SOL via a QR code modal (accessible from the header or `/deposit`), or withdraw SOL to any address (10/25/50/Max) signed by the embedded wallet.
- **Token search** — full Solana token search via BirdEye (`/` shortcut or the header search bar), not limited to trending tokens.
- **Security** — Privy JWT authentication (`jose` + JWKS) enforced on all mutating API routes (trades, profile edits, follow/unfollow). BirdEye API key is server-side only — the `/api/birdeye` proxy is the only path to market data. Alchemy RPC key is domain-allowlisted in the Alchemy dashboard.
- **Extras** — a live BTC/SOL/JUP majors ticker at the bottom and a "blur balances" privacy toggle in the user menu.

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
│   ├── page.tsx          Redirects to top trending token's trade page
│   ├── trade/[address]   Trading terminal
│   ├── activity          Trade history
│   ├── profile           Profile + follow graph
│   ├── deposit           Receive SOL (QR code page)
│   ├── withdraw          Send SOL
│   └── api/              birdeye proxy · trades · profile · follow
├── components/
│   ├── AppShell.tsx      Layout shell (header + discovery panel + mobile gate)
│   ├── AppHeader.tsx     Top bar: logo, search, portfolio balance, user menu
│   ├── DiscoveryPanel.tsx Collapsible left sidebar (Alerts / Tokens / Leaderboard / Feed)
│   ├── Landing.tsx       Unauthenticated landing / sign-in screen
│   ├── Logo.tsx          ChadWallet logo
│   ├── MajorsTicker.tsx  Bottom status bar with live SOL/JUP/BONK/WIF/JTO prices
│   ├── SearchCommand.tsx Token search modal (/ shortcut)
│   ├── DepositModal.tsx  Deposit QR modal (triggered from header)
│   ├── TradingChart.tsx  lightweight-charts candlestick + volume chart
│   ├── ActivityFeed.tsx  Wallet trade history
│   ├── SectionBoundary.tsx Error boundary wrapper for page sections
│   ├── portfolio/
│   │   ├── NetWorth.tsx        Total portfolio value + 24h change
│   │   ├── NetWorthChart.tsx   Recharts area chart of portfolio value
│   │   └── HoldingsGrid.tsx    Token-by-token balance table
│   ├── trade/
│   │   ├── TradePanel.tsx      Buy/Sell panel with Jupiter swap
│   │   ├── TokenStats.tsx      Price, market cap, volume, supply stats
│   │   └── LiveFeed.tsx        Swaps feed + holders list
│   └── ui/               Shared primitives (Skeleton, Sparkline, PriceBadge, TokenLogo, etc.)
└── lib/
    ├── birdeye.ts        All BirdEye data-fetching functions
    ├── solana.ts         useSolanaWallet hook (Privy wrapper)
    ├── holdings.ts       On-chain balance + portfolio fetch
    ├── auth-server.ts    Server-side Privy JWT verification
    ├── supabase.ts       Supabase client singleton
    ├── watchlist.ts      Client-side watchlist persistence
    ├── usePortfolio.ts   Portfolio state hook
    ├── useProfile.ts     Profile state + mutation hook
    ├── format.ts         Number/price formatters
    ├── handle.ts         Wallet address → @handle generator
    └── types.ts          Shared TypeScript interfaces
supabase/
└── setup.sql             One-shot schema + seed for trades/profiles/follows
```

## Deploy

Deploy on [Vercel](https://vercel.com/new): import the repo, add the environment
variables above, and ship. Pushes to `main` deploy to production automatically.
See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying)
for details.
