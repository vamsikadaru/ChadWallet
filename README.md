# ChadWallet

A mobile-first Solana trading wallet. Sign in with an email, get an embedded wallet, and trade SPL tokens with live market data — no browser extension or seed phrase required.

## Features

- **Embedded wallet** — passwordless sign-in and a non-custodial Solana wallet via [Privy](https://privy.io).
- **Swap any token** — buy/sell SPL tokens through [Jupiter v6](https://station.jup.ag/docs/apis/swap-api), with slippage control and price-impact estimates.
- **Live markets** — trending tokens, prices, and charts powered by [BirdEye](https://birdeye.so) (proxied server-side so the API key never ships to the client).
- **Portfolio & activity** — net worth, holdings, and trade history backed by [Supabase](https://supabase.com).
- **Deposit** — receive SOL via a QR code for your wallet address.

## Tech Stack

| Layer       | Choice                                              |
| ----------- | --------------------------------------------------- |
| Framework   | Next.js 16 (App Router) · React 19                  |
| Styling     | Tailwind CSS v4 · Framer Motion                     |
| Auth/Wallet | Privy (Solana embedded wallets)                     |
| Swaps       | Jupiter v6 quote + swap API                          |
| Market data | BirdEye (via `/api/birdeye` proxy)                   |
| RPC         | Alchemy (Solana mainnet-beta)                        |
| Database    | Supabase (trade history)                             |
| Charts      | lightweight-charts · recharts                        |

## Getting Started

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy the variables below into `.env.local`:

```bash
# Privy — https://dashboard.privy.io
NEXT_PUBLIC_PRIVY_APP_ID=

# Solana RPC — https://alchemy.com
NEXT_PUBLIC_ALCHEMY_RPC_URL=

# BirdEye — https://birdeye.so (server key stays private; public key is the fallback)
BIRDEYE_API_KEY=
NEXT_PUBLIC_BIRDEYE_API_KEY=

# Supabase — https://supabase.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Base URL used for server-side fetches (default: http://localhost:3000)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> Missing BirdEye keys won't break the UI — the app falls back to mock token data so you never hit a blank screen.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

Trade history is stored in a Supabase `trades` table. Create it with:

```sql
create table trades (
  id            uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  type          text not null,           -- 'buy' | 'sell'
  token_address text not null,
  amount_sol    numeric,
  amount_token  numeric,
  created_at    timestamptz default now()
);
```

## Scripts

| Command         | Description                  |
| --------------- | ---------------------------- |
| `npm run dev`   | Start the dev server         |
| `npm run build` | Production build             |
| `npm run start` | Serve the production build   |
| `npm run lint`  | Run ESLint                   |

## Project Structure

```
src/
├── app/            Routes — portfolio (/), trending, trade/[address], activity, deposit
│   └── api/        Server routes — birdeye proxy, trades
├── components/     UI, trade, portfolio, and trending components
└── lib/            Privy/Solana, BirdEye, Supabase, formatting helpers
```

## Deploy

Deploy on [Vercel](https://vercel.com/new): import the repo, add the environment variables above, and ship. See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for details.
