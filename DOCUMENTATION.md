# ChadWallet — Complete Project Documentation

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Features](#features)
6. [Environment Variables](#environment-variables)
7. [Database](#database)
8. [API Routes](#api-routes)
9. [Authentication & Security](#authentication--security)
10. [Key Modules](#key-modules)
11. [Components](#components)
12. [Data Flow](#data-flow)
13. [Deployment](#deployment)
14. [Local Development](#local-development)
15. [Known Limitations](#known-limitations)

---

## Overview

ChadWallet is a non-custodial Solana trading terminal. Users sign in with Google, Apple, or email and receive an embedded Solana wallet instantly — no browser extension, seed phrase, or crypto knowledge required. From there they can browse live markets, swap tokens via Jupiter, monitor their portfolio, and follow other traders.

**Live:** https://my-chadwallet.vercel.app

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) · React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 · Framer Motion |
| Auth / Wallet | Privy (embedded Solana wallets) |
| Swaps | Jupiter v6 Quote + Swap API |
| Market Data | BirdEye (via server-side proxy) |
| RPC | Alchemy (Solana mainnet-beta) |
| Database | Supabase (PostgreSQL + RLS) |
| Charts | lightweight-charts (candlesticks) · recharts (net worth) |
| Deployment | Vercel (Fluid Compute) |

---

## Architecture

### Rendering Strategy

The app is built on Next.js 16 App Router. Most pages are **client components** (`"use client"`) because they depend on wallet state from Privy, which is browser-only. Server components are only used where there is no wallet dependency.

### API Key Protection

BirdEye's API key must never reach the browser. All BirdEye calls go through a server-side proxy at `/api/birdeye`. Client components call `/api/birdeye?type=...` using relative URLs. The proxy adds the `X-API-KEY` header and forwards the response.

### Authentication

Privy issues a short-lived JWT to the browser after sign-in. Mutating API routes (`POST /api/trades`, `POST /api/profile`, `POST /api/follow`, `DELETE /api/follow`) require this JWT in the `Authorization: Bearer <token>` header. The server verifies it using Privy's public JWKS endpoint — no app secret is needed.

### Database Access

Supabase is accessed directly from both client and server using the anon/publishable key. Row Level Security (RLS) policies on each table control what operations are allowed. Authentication is handled by Privy, not Supabase Auth.

---

## Project Structure

```
ChadWallet/
├── src/
│   ├── app/                        Next.js App Router pages
│   │   ├── layout.tsx              Root layout (Providers, AppShell, MajorsTicker)
│   │   ├── page.tsx                Markets page (/)
│   │   ├── trade/[address]/        Trading terminal for a specific token
│   │   ├── activity/               Trade history feed
│   │   ├── profile/                User profile + follow graph
│   │   ├── deposit/                Receive SOL (QR code)
│   │   ├── withdraw/               Send SOL to any address
│   │   └── api/
│   │       ├── birdeye/route.ts    Server-side BirdEye proxy
│   │       ├── trades/route.ts     Trade log (GET + POST)
│   │       ├── profile/route.ts    Profile read/write
│   │       └── follow/route.ts     Follow / unfollow
│   ├── components/
│   │   ├── AppShell.tsx            Layout shell (sidebar + bottom nav)
│   │   ├── MajorsTicker.tsx        Bottom status bar with live SOL/JUP/BONK/WIF/JTO prices
│   │   ├── SearchCommand.tsx       Token search modal (/ shortcut)
│   │   ├── TradingChart.tsx        lightweight-charts candlestick + volume chart
│   │   ├── ActivityFeed.tsx        Wallet trade history
│   │   ├── Sidebar.tsx             Desktop navigation
│   │   ├── BottomNav.tsx           Mobile navigation
│   │   ├── portfolio/
│   │   │   ├── NetWorth.tsx        Total portfolio value + 24h change
│   │   │   ├── NetWorthChart.tsx   Recharts area chart of portfolio value
│   │   │   └── HoldingsGrid.tsx    Token-by-token balance table
│   │   ├── trade/
│   │   │   ├── TradePanel.tsx      Buy/Sell panel with Jupiter swap
│   │   │   ├── TokenRail.tsx       Recently viewed tokens rail
│   │   │   ├── TokenStats.tsx      Price, market cap, volume, supply stats
│   │   │   └── LiveFeed.tsx        Swaps feed + holders list
│   │   ├── trending/
│   │   │   ├── TrendingView.tsx    Markets page table (Trending + Crypto tabs)
│   │   │   └── HotStrip.tsx        Scrolling hot tokens strip
│   │   ├── profile/
│   │   │   └── FollowTopTraders.tsx  "Follow top traders" rail
│   │   └── ui/                     Shared primitives (Skeleton, Sparkline, PriceBadge, etc.)
│   └── lib/
│       ├── birdeye.ts              All BirdEye data-fetching functions
│       ├── solana.ts               useSolanaWallet hook (Privy wrapper)
│       ├── holdings.ts             On-chain balance + portfolio fetch
│       ├── auth-server.ts          Server-side Privy JWT verification
│       ├── supabase.ts             Supabase client singleton
│       ├── usePortfolio.ts         Portfolio state hook
│       ├── useProfile.ts           Profile state + mutation hook
│       ├── format.ts               Number/price formatters
│       ├── handle.ts               Wallet address → @handle generator
│       ├── types.ts                Shared TypeScript interfaces
│       ├── mock.ts                 Fallback mock tokens + sparklines
│       ├── nav.ts                  Navigation link definitions
│       └── rate-limit.ts           In-memory sliding window rate limiter (unused)
├── supabase/
│   └── setup.sql                   One-shot schema + seed script
├── public/                         Static assets
├── .env.local                      Local environment variables (gitignored)
├── CLAUDE.md                       AI assistant instructions
└── AGENTS.md                       Agent guidance
```

---

## Features

### Embedded Wallet (Privy)

Users sign in with Google, Apple, email, or an external wallet (Phantom etc.). Privy creates a non-custodial embedded Solana wallet automatically. The private key is split using threshold cryptography — ChadWallet never has access to it. Sign-in state is persisted across sessions.

### Markets Page (`/`)

- Displays the top 20 trending Solana tokens from BirdEye, refreshed every 30 seconds
- **Trending tab**: ranked by BirdEye's trending score, filterable by All / Gainers / Losers
- **Crypto tab**: 12 curated major Solana tokens (SOL, USDC, JUP, BONK, WIF, etc.) with live prices
- **HotStrip**: horizontally scrolling strip of trending tokens with badge showing % change
- Data is fetched client-side so it works correctly on Vercel (avoids server-to-self HTTP calls)

### Token Search (`/` shortcut)

- Press `/` anywhere to open the search modal
- Queries BirdEye's `/defi/v3/search` endpoint — searches all Solana tokens by name or symbol, not just trending ones
- Results filtered to tokens with a live price > 0
- Verified tokens surfaced first, then sorted by 24h volume

### Trading Terminal (`/trade/[address]`)

Each token has its own page with:

- **Candlestick chart** (lightweight-charts): OHLCV data from BirdEye. Range options: 1D, 1W, 1M, 3M, 1Y. Falls back to a price-history line chart for illiquid tokens. Y-axis uses adaptive formatting for micro-cap prices.
- **Price ⇄ MCap toggle**: switch the Y-axis between USD price and market cap
- **Token stats panel**: price, 24h change, volume, market cap, liquidity, buy/sell ratio, supply
- **Security badge**: shows Safe / Caution / Risky based on mint authority, freeze authority, and top-10 holder concentration
- **Live feeds tab**: recent on-chain swaps, top token holders
- **Token rail**: recently viewed tokens for quick navigation
- **Buy / Sell panel**: see below

### Buy / Sell (Jupiter Swaps)

The `TradePanel` component handles swaps:

1. User enters an amount in SOL (buy) or token (sell)
2. App calls Jupiter v6 Quote API to get the best route and price impact
3. User clicks Buy/Sell → app calls Jupiter v6 Swap API to get a serialized transaction
4. Transaction is signed by the Privy embedded wallet and sent to Solana mainnet via Alchemy RPC
5. On success, the trade is logged to Supabase via `POST /api/trades`

Slippage is configurable (default 0.5%). Price impact is shown before confirmation.

### Live Portfolio (`/` after sign-in)

- Reads the wallet's native SOL balance and all SPL token accounts directly from the Alchemy RPC
- Prices each holding using BirdEye's `token_overview` endpoint
- Hides sub-cent dust (< $0.01 value)
- Shows net worth, individual holdings sorted by value, and a value-weighted 24h change
- Net worth area chart (recharts) shows portfolio history

### Deposit (`/deposit`)

- Displays the wallet address as text and a QR code
- User shares the address or shows the QR to receive SOL or tokens from any external source
- X button returns to the previous page

### Withdraw (`/withdraw`)

- User enters a destination Solana address and selects 10% / 25% / 50% / Max of their SOL balance
- Transaction is signed by the Privy wallet and sent on-chain
- X button returns to the previous page

### Profile & Social (`/profile`)

- Auto-generated handle derived from the wallet address (e.g., `@vamsi_8VRR`)
- Editable display name and bio
- Follower / following counts and lists
- **Follow Top Traders rail**: seeded profiles shown with follower counts; user can follow/unfollow in one click

### Activity Feed (`/activity`)

- Lists the user's trade history fetched from Supabase
- Shows token, side (buy/sell), amount, and timestamp

### Majors Ticker (bottom bar)

- Persistent bottom bar on desktop showing live prices for SOL, JUP, BONK, WIF, JTO
- Fetches prices sequentially (one at a time) to avoid BirdEye rate limiting
- Refreshes every 60 seconds
- Each token is a link to its trade page

### Privacy Toggle

- "Blur balances" option hides portfolio values for privacy when screen sharing

---

## Environment Variables

Create `.env.local` in the project root:

```bash
# Privy — https://dashboard.privy.io
NEXT_PUBLIC_PRIVY_APP_ID=

# Solana RPC — https://alchemy.com
# Add your production domain + localhost to the Alchemy dashboard allowlist.
NEXT_PUBLIC_ALCHEMY_RPC_URL=

# BirdEye — https://birdeye.so
# Server-side ONLY — do NOT prefix with NEXT_PUBLIC_
BIRDEYE_API_KEY=

# Supabase — https://supabase.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Notes

- `NEXT_PUBLIC_` variables are bundled into the client JavaScript. Only use this prefix for values that are safe to expose publicly.
- `BIRDEYE_API_KEY` must NOT have the `NEXT_PUBLIC_` prefix. It is only accessible server-side via the `/api/birdeye` proxy.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is designed to be public (it has a `sb_publishable_` prefix). Security is enforced via Supabase RLS policies, not by hiding the key.
- `NEXT_PUBLIC_ALCHEMY_RPC_URL` is intentionally public because it is used client-side to read on-chain data. Restrict it in the Alchemy dashboard by adding your production domain (`https://my-chadwallet.vercel.app`) and `http://localhost:3000` to the allowlist.

### Vercel

Add all variables above in **Vercel → Project Settings → Environments → Production → Environment Variables**. After adding or changing variables, redeploy for them to take effect.

---

## Database

### Setup

Run `supabase/setup.sql` once in **Supabase → SQL Editor**. It is idempotent (safe to re-run).

### Tables

#### `trades`

Stores every swap executed through the trade panel.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `wallet_address` | text | Trader's Solana wallet address |
| `type` | text | `'buy'` or `'sell'` |
| `token_address` | text | SPL token mint address |
| `amount_sol` | numeric | SOL amount in the swap |
| `amount_token` | numeric | Token amount in the swap |
| `created_at` | timestamptz | Timestamp |

#### `profiles`

One row per wallet. Seeded "top traders" have `is_seed = true`.

| Column | Type | Description |
|---|---|---|
| `wallet_address` | text | Primary key |
| `handle` | text | Unique @handle (auto-generated or custom) |
| `username` | text | Display name |
| `bio` | text | Bio text |
| `avatar_seed` | text | Seed string for deterministic avatar generation |
| `is_seed` | boolean | True for seeded top-trader profiles |
| `created_at` | timestamptz | Timestamp |

#### `follows`

Directed follow graph.

| Column | Type | Description |
|---|---|---|
| `follower` | text | Wallet address of the follower |
| `following` | text | Wallet address being followed |
| `created_at` | timestamptz | Timestamp |

Primary key is `(follower, following)` — enforces no duplicate follows.

### Row Level Security

All three tables have RLS enabled. The anon key can read all rows and insert/delete its own — there are no per-user ownership checks at the database level. Authorization (ensuring a user only writes data for their own wallet) is enforced in the API route handlers via Privy JWT verification.

---

## API Routes

All routes live under `src/app/api/`.

### `GET /api/birdeye`

Server-side proxy to BirdEye. Adds the `X-API-KEY` header so the key never reaches the client bundle.

**Query params:**
- `type` — one of: `trending`, `tokenlist`, `ohlcv`, `history_price`, `token_overview`, `trades`, `price`, `multi_price`, `holder`, `search`, `security`, `new_listing`, `top_traders`
- All other params are forwarded to BirdEye as-is

**Notes:**
- `type=ohlcv` and `type=history_price` use an `interval` param (e.g. `1H`) which the proxy remaps to BirdEye's `type` param internally
- Returns `{ error, fallback: true }` when the key is missing or BirdEye returns an error — callers check `json.fallback` and degrade gracefully

---

### `GET /api/trades`

Returns a wallet's trade history from Supabase.

**Query params:** `wallet_address`

**Response:** `{ trades: Trade[] }`

---

### `POST /api/trades`

Logs a completed swap. Requires a valid Privy JWT.

**Headers:** `Authorization: Bearer <token>`

**Body:** `{ wallet_address, type, token_address, amount_sol, amount_token }`

**Response:** `{ success: true, trade }`

---

### `GET /api/profile`

Fetches a single profile or the top traders list.

**Query params:**
- `wallet` — fetch a single profile
- `viewer` — (optional) viewer's wallet, used to compute `isFollowing`
- `top=1` — returns the seeded top traders list with follower counts

**Response (single):** `{ profile, followers, following, isFollowing }`

**Response (top):** `{ traders: [...] }`

---

### `POST /api/profile`

Creates or updates a profile. Requires a valid Privy JWT.

**Headers:** `Authorization: Bearer <token>`

**Body:** `{ wallet_address, username?, bio? }`

- If `username` and `bio` are omitted: ensures the profile row exists (insert if missing, no-op if present)
- If either is provided: performs a profile edit

---

### `POST /api/follow`

Follows a user. Requires a valid Privy JWT.

**Headers:** `Authorization: Bearer <token>`

**Body:** `{ follower, following }`

---

### `DELETE /api/follow`

Unfollows a user. Requires a valid Privy JWT.

**Headers:** `Authorization: Bearer <token>`

**Query params:** `follower`, `following`

---

## Authentication & Security

### Privy JWT Verification (`src/lib/auth-server.ts`)

Every mutating API route calls `requireAuth(req)` before touching the database. This function:

1. Reads the `Authorization: Bearer <token>` header
2. Verifies the JWT signature using Privy's public JWKS endpoint (`https://auth.privy.io/api/v1/apps/{APP_ID}/jwks.json`)
3. Validates `issuer: "privy.io"` and `audience: APP_ID`
4. Returns the user's Privy DID (`did:privy:...`) on success, or `null` on failure

The JWKS is fetched once and cached by `jose`'s `createRemoteJWKSet`. No app secret or private key is needed server-side.

### Client-Side Auth (`src/lib/useProfile.ts`, `src/components/trade/TradePanel.tsx`)

Before any mutating fetch, the client calls `getAccessToken()` from Privy's `usePrivy()` hook to get a fresh JWT, then attaches it as `Authorization: Bearer <token>`.

### BirdEye Key Protection

`BIRDEYE_API_KEY` is a server-only environment variable. The `/api/birdeye` route is the only code path that reads it. Client code never imports or references this key directly.

### Alchemy RPC Restriction

`NEXT_PUBLIC_ALCHEMY_RPC_URL` is visible in the client bundle but restricted in the Alchemy dashboard to only accept requests from `https://my-chadwallet.vercel.app` and `http://localhost:3000`.

### Supabase RLS

The Supabase anon key is public by design. RLS policies allow anyone to read all data (public social features) but writes are authenticated at the API layer before they reach Supabase.

---

## Key Modules

### `src/lib/birdeye.ts`

All BirdEye data-fetching. Every function is client/server safe — it routes through `/api/birdeye` (relative URL on client, absolute URL using `VERCEL_URL` or `NEXT_PUBLIC_SITE_URL` on server).

Key functions:

| Function | BirdEye endpoint | Description |
|---|---|---|
| `getTrendingTokens()` | `/defi/token_trending` | Top 20 trending tokens |
| `getTokenOverview(address)` | `/defi/token_overview` | Full stats for one token |
| `getOHLCV(address, range)` | `/defi/ohlcv` | Candlestick data |
| `getPriceHistory(address, range)` | `/defi/history_price` | Price line history |
| `getCandles(address, range)` | both | OHLCV with fallback to price line |
| `getTokenTrades(address)` | `/defi/txs/token` | Recent on-chain swaps |
| `getTokenHolders(address)` | `/defi/v3/token/holder` | Top holders |
| `getTokenSecurity(address)` | `/defi/token_security` | Mint/freeze authority, concentration |
| `getPrice(address)` | `/defi/price` | Single live price + 24h change |
| `getMultiPrice(addresses)` | `/defi/multi_price` | Prices for many mints at once |
| `searchTokens(keyword)` | `/defi/v3/search` | Full token search |
| `getCryptoTokens()` | `/defi/token_overview` ×12 | Major Solana tokens (batched) |
| `getNewListings()` | `/defi/token_new_listing` | Recently listed tokens |

Time windows are quantized to 60-second buckets so repeated requests within a minute hit the CDN cache instead of BirdEye.

### `src/lib/holdings.ts`

Fetches the wallet's on-chain portfolio:
1. Reads native SOL balance + all SPL token accounts (legacy Token Program + Token-2022) from Alchemy RPC
2. Caps at 30 tokens to avoid unbounded fan-out
3. Prices each token via `getTokenOverview`
4. Filters out sub-cent dust (< $0.01)
5. Returns sorted holdings, net worth, and live SOL price

### `src/lib/solana.ts`

Thin wrapper around Privy's Solana hooks. Exposes `useSolanaWallet()` which returns:
- `wallet` — the active embedded wallet object
- `address` — the wallet's public key as a string
- `sendSerialized(bytes)` — signs and submits a serialized transaction on Solana mainnet

### `src/lib/auth-server.ts`

Server-only. Verifies Privy JWTs. See [Authentication & Security](#authentication--security).

### `src/lib/handle.ts`

Generates a deterministic `@handle` from a wallet address (e.g. `8VRRHa5X` → `@vamsi_8VRR`). Used as the default handle when a profile is first created.

### `src/lib/format.ts`

Number formatting utilities:
- `formatPrice(n)` — adaptive price formatting (handles micro-cap prices like `$0.000000042`)
- `compact(n)` — shortens large numbers (`1500000` → `1.5M`)
- `formatPct(n)` — formats percentage with sign (`+2.34%`)

---

## Components

### `AppShell`

Wraps all pages. Renders `Sidebar` on desktop, `BottomNav` on mobile, and `MajorsTicker` at the bottom. Handles the blur-balances context.

### `TradingChart`

Dynamically imported (SSR disabled) lightweight-charts instance. Renders candlestick + volume series. Handles:
- Range switching with a loading state while new data loads
- Price ⇄ MCap toggle (fetches MCap from token overview)
- Adaptive Y-axis for micro-cap prices
- "No chart data" empty state when BirdEye returns no candles

### `TradePanel`

The Buy/Sell widget. Flow:
1. User types amount → debounced Jupiter Quote API call
2. Displays output amount, price impact, minimum received
3. On submit: calls Jupiter Swap API → signs with Privy → sends via Alchemy → logs to Supabase

### `SearchCommand`

Full-screen search modal triggered by the `/` key. Queries `searchTokens()` on each keystroke (debounced). Verified tokens appear first.

### `LiveFeed` (`LiveTrades`, `HoldersList`)

- `LiveTrades`: polls `getTokenTrades()` every 15 seconds and renders recent swaps with buy/sell color coding
- `HoldersList`: fetches and renders the top token holders with supply percentage

### `MajorsTicker`

Fixed bottom bar. Fetches prices for SOL, JUP, BONK, WIF, JTO sequentially (one at a time) to avoid BirdEye rate limits. Updates every 60 seconds.

### `HotStrip`

Horizontally scrolling marquee of trending token cards, each showing symbol, price, and 24h change badge.

### UI Primitives (`src/components/ui/`)

- `Skeleton` — loading placeholder
- `Sparkline` — mini SVG price chart using recharts
- `PriceBadge` — green/red pill showing percentage change
- `TokenLogo` — token image with fallback initial
- `FadeIn` / `motion` — Framer Motion wrappers

---

## Data Flow

### Markets page load

```
Browser → GET /
  → TrendingPage (client component)
  → TrendingView mounts → getTrendingTokens()
  → GET /api/birdeye?type=trending
  → BirdEye /defi/token_trending
  → 20 tokens rendered, refresh every 30s
```

### Trade page load

```
Browser → GET /trade/[address]
  → page.tsx (client component) mounts
  → parallel:
      getTokenOverview()   → /api/birdeye?type=token_overview
      getCandles()         → /api/birdeye?type=ohlcv (+ history_price fallback)
      getTokenSecurity()   → /api/birdeye?type=security
  → LiveTrades mounts     → /api/birdeye?type=trades (polls every 15s)
  → HoldersList mounts    → /api/birdeye?type=holder
```

### Buy flow

```
User types amount
  → Jupiter Quote API (direct, no proxy needed — no secret key)
  → Display quote

User clicks Buy
  → getAccessToken() [Privy]
  → POST /api/trades (auth check: requireAuth)
  → Jupiter Swap API → serialized transaction
  → useSolanaWallet.sendSerialized()
  → Privy signs + sends via Alchemy RPC
  → Supabase: insert into trades
```

### Portfolio load

```
usePortfolio hook mounts
  → fetchHoldings(address, rpcUrl)
  → Alchemy RPC: getBalance + getParsedTokenAccountsByOwner
  → For each holding: getTokenOverview() → /api/birdeye?type=token_overview
  → Sorted holdings + net worth returned
```

---

## Deployment

The app deploys automatically to Vercel on every push to `main`.

### Vercel Environment Variables

Set these in **Project Settings → Environments → Production**:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Your Privy App ID |
| `NEXT_PUBLIC_ALCHEMY_RPC_URL` | Alchemy Solana mainnet URL |
| `BIRDEYE_API_KEY` | BirdEye API key (no NEXT_PUBLIC_ prefix) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key |

After adding or changing any variable, go to **Deployments → latest → Redeploy**.

### Alchemy Key Restriction

In the Alchemy dashboard, under **Security → Allowlist → Domain**, add:
- `https://my-chadwallet.vercel.app`
- `http://localhost:3000`

This prevents the key from being used from any other origin even though it is in the client bundle.

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local with all variables (see Environment Variables section)

# 3. Set up the Supabase database (one time)
# Copy supabase/setup.sql and run it in Supabase → SQL Editor

# 4. Start the dev server
npm run dev
```

Open http://localhost:3000.

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Serve production build locally |
| `npm run lint` | Run ESLint |

### Testing Features Locally

All features (buy, sell, deposit, withdraw) run on **Solana mainnet**. To test:

1. Sign in → your embedded wallet address appears on the Deposit page
2. Send a small amount of SOL to that address (0.05 SOL is enough for all tests)
3. Buy: go to any token trade page → enter 0.001 SOL → confirm
4. Sell: switch to Sell on the same page → sell what you bought
5. Withdraw: go to Withdraw → paste an external wallet address → send SOL back

There is no devnet mode. All transactions use real funds — keep amounts small when testing.

---

## Known Limitations

| Area | Limitation |
|---|---|
| Rate limiting | No app-level rate limiting on API routes. BirdEye's own free-tier limits apply (~30 req/min). |
| Portfolio accuracy | Holdings are priced at the current BirdEye spot price, not historical cost basis. P&L is not tracked. |
| Trade log | Only swaps executed through ChadWallet's trade panel are logged. External transactions are not imported. |
| Token coverage | BirdEye free tier may not have price data for very new or very illiquid tokens. |
| Multi-wallet | Only the first Privy embedded wallet is used. External wallets connected via Privy are not shown in the portfolio. |
| Majors ticker | Prices fetched sequentially — visible slight delay as each fills in on page load. |
| Social auth | Follow graph uses wallet addresses, not Privy DIDs — a user with multiple wallets would have separate social profiles. |
