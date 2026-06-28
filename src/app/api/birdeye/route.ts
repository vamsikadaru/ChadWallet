import { NextResponse } from "next/server";

const BIRDEYE = "https://public-api.birdeye.so";
const GECKO   = "https://api.geckoterminal.com/api/v2";
const GECKO_H = { Accept: "application/json;version=20230302" };

// Solana RPC endpoints tried in order for the holder fallback.
// Helius is tried first when HELIUS_API_KEY is set (free tier: helius.dev).
function solanaRpcs() {
  const helius = process.env.HELIUS_API_KEY;
  return [
    ...(helius ? [`https://mainnet.helius-rpc.com/?api-key=${helius}`] : []),
    "https://api.mainnet-beta.solana.com",
    "https://solana-mainnet.g.alchemy.com/v2/demo",
  ];
}

/**
 * Server-side BirdEye proxy. The API key never reaches the client bundle.
 * Whitelisted endpoints only.
 *
 * Fallback chain:
 *  trades → BirdEye → GeckoTerminal (top pool for the mint, free, no key)
 *  holder → BirdEye → Solana RPC getTokenLargestAccounts (free, no key)
 */
const ENDPOINTS: Record<string, string> = {
  trending:    "/defi/token_trending",
  tokenlist:   "/defi/tokenlist",
  ohlcv:       "/defi/ohlcv",
  history_price: "/defi/history_price",
  token_overview: "/defi/token_overview",
  trades:      "/defi/txs/token",
  price:       "/defi/price",
  multi_price: "/defi/multi_price",
  holder:      "/defi/v3/token/holder",
  search:      "/defi/v3/search",
  security:    "/defi/token_security",
  new_listing: "/defi/token_new_listing",
  top_traders: "/defi/v2/tokens/top_traders",
};

// Per-type server-side cache TTLs (seconds). Previously trades/holder used
// no-store, causing every 8-second poll to hit BirdEye directly and exhaust
// the free-tier compute unit limit. Caching means BirdEye is called at most
// once per TTL window regardless of how many clients poll the same token.
const CACHE_TTL: Record<string, number> = {
  trades: 60,
  holder: 120,
};

function apiKey() {
  return process.env.BIRDEYE_API_KEY ?? "";
}

// ─── GeckoTerminal fallback for /trades ─────────────────────────────────────
// Fetches the top Solana pool for a mint, then returns its 300 most recent
// trades in a format that the existing getTokenTrades() client parser accepts.
async function getGeckoTrades(mint: string): Promise<NextResponse> {
  if (!mint) return NextResponse.json({ error: "no_mint", fallback: true });
  try {
    // Step 1: top pool by 24h volume — cached for 1 h (pools rarely rotate)
    const poolsRes = await fetch(
      `${GECKO}/networks/solana/tokens/${mint}/pools?page=1`,
      { headers: GECKO_H, next: { revalidate: 3600 } } as RequestInit
    );
    if (!poolsRes.ok) return NextResponse.json({ error: "gecko_pools_fail", fallback: true });
    const poolsJson = await poolsRes.json();
    const pools: unknown[] = poolsJson?.data ?? [];
    if (!pools.length) return NextResponse.json({ error: "no_pools", fallback: true });

    // Pool IDs are "solana_{pairAddress}"
    const topPoolId = ((pools[0] as Record<string, unknown>).id as string) ?? "";
    const pairAddress = topPoolId.replace("solana_", "");
    if (!pairAddress) return NextResponse.json({ error: "no_pair", fallback: true });

    // Step 2: recent trades for the top pool (up to 300) — cached 60 s
    const tradesRes = await fetch(
      `${GECKO}/networks/solana/pools/${pairAddress}/trades`,
      { headers: GECKO_H, next: { revalidate: 60 } } as RequestInit
    );
    if (!tradesRes.ok) return NextResponse.json({ error: "gecko_trades_fail", fallback: true });
    const tradesJson = await tradesRes.json();
    const trades: unknown[] = tradesJson?.data ?? [];
    if (!trades.length) return NextResponse.json({ error: "no_trades", fallback: true });

    // Map to the shape that getTokenTrades() already parses:
    //   { side, blockUnixTime, volumeUsd, price, owner, txHash }
    const items = trades
      .map((t: unknown) => {
        const attrs = ((t as Record<string, unknown>).attributes ?? {}) as Record<string, unknown>;

        const fromAddr = String(attrs.from_token_address ?? "");
        const toAddr   = String(attrs.to_token_address ?? "");
        const fromIsTarget = fromAddr === mint;
        const toIsTarget   = toAddr   === mint;
        // side from our token's perspective: we receive it → buy, we send it → sell
        const side = toIsTarget ? "buy" : fromIsTarget ? "sell" : null;
        if (!side) return null;

        const ts = attrs.block_timestamp
          ? new Date(String(attrs.block_timestamp)).getTime() / 1000
          : 0;
        if (!ts) return null;

        const volume = parseFloat(String(attrs.volume_in_usd ?? "0")) || 0;
        const price  = fromIsTarget
          ? parseFloat(String(attrs.price_from_in_usd ?? "0")) || 0
          : parseFloat(String(attrs.price_to_in_usd   ?? "0")) || 0;
        const txHash = String(attrs.tx_hash ?? "");
        const owner  = String(attrs.tx_from_address ?? txHash);

        return { blockUnixTime: ts, side, volumeUsd: volume, price, owner, txHash };
      })
      .filter(Boolean);

    return NextResponse.json(
      { success: true, data: { items } },
      { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" } }
    );
  } catch {
    return NextResponse.json({ error: "gecko_failed", fallback: true });
  }
}

// ─── GeckoTerminal fallback for /ohlcv ──────────────────────────────────────
// Maps our interval strings to GeckoTerminal timeframe + aggregate params.
const INTERVAL_TO_GT: Record<string, { tf: string; agg: number; limit: number }> = {
  "15m": { tf: "minute", agg: 15, limit: 200 },
  "1H":  { tf: "hour",   agg: 1,  limit: 200 },
  "4H":  { tf: "hour",   agg: 4,  limit: 200 },
  "12H": { tf: "hour",   agg: 12, limit: 200 },
  "1D":  { tf: "day",    agg: 1,  limit: 400 },
};

async function getGeckoOHLCV(mint: string, interval: string, timeTo: number): Promise<NextResponse> {
  const gt = INTERVAL_TO_GT[interval];
  if (!gt || !mint) return NextResponse.json({ fallback: true });

  try {
    // Pool address — cached 1 hour (same as trades fallback)
    const poolsRes = await fetch(
      `${GECKO}/networks/solana/tokens/${mint}/pools?page=1`,
      { headers: GECKO_H, next: { revalidate: 3600 } } as RequestInit
    );
    if (!poolsRes.ok) return NextResponse.json({ fallback: true });
    const poolsJson = await poolsRes.json();
    const pools: unknown[] = poolsJson?.data ?? [];
    if (!pools.length) return NextResponse.json({ fallback: true });

    const topPoolId   = ((pools[0] as Record<string, unknown>).id as string) ?? "";
    const pairAddress = topPoolId.replace("solana_", "");
    if (!pairAddress) return NextResponse.json({ fallback: true });

    // OHLCV candles — cached 60 s
    const ts = timeTo > 0 ? timeTo : Math.floor(Date.now() / 1000);
    const ohlcvRes = await fetch(
      `${GECKO}/networks/solana/pools/${pairAddress}/ohlcv/${gt.tf}` +
        `?aggregate=${gt.agg}&limit=${gt.limit}&currency=usd&before_timestamp=${ts}`,
      { headers: GECKO_H, next: { revalidate: 60 } } as RequestInit
    );
    if (!ohlcvRes.ok) return NextResponse.json({ fallback: true });
    const ohlcvJson = await ohlcvRes.json();

    // GeckoTerminal: [timestamp_seconds, open, high, low, close, volume_base]
    // Returns newest-first; our parser expects oldest-first.
    const list: unknown[] = ohlcvJson?.data?.attributes?.ohlcv_list ?? [];
    if (!list.length) return NextResponse.json({ fallback: true });

    const items = (list as [number, number, number, number, number, number][])
      .map(([ts2, o, h, l, c, v = 0]) => {
        if (!isFinite(c) || c <= 0) return null;
        return { unixTime: ts2, o, h, l, c, v: v ?? 0 };
      })
      .filter(Boolean)
      .reverse(); // oldest-first

    return NextResponse.json(
      { success: true, data: { items } },
      { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" } }
    );
  } catch {
    return NextResponse.json({ fallback: true });
  }
}

// ─── Solana RPC fallback for /holder ────────────────────────────────────────
// Resolves the top-20 holders of an SPL token via two public RPC calls
// (getTokenLargestAccounts + getMultipleAccounts). Returns data in
// BirdEye-compatible format so getTokenHolders() needs no changes.
async function getSolanaHolders(mint: string): Promise<NextResponse> {
  if (!mint) return NextResponse.json({ error: "no_mint", fallback: true });

  for (const rpc of solanaRpcs()) {
    try {
      // Step 1: top-20 token accounts by balance
      const largestRes = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: 1,
          method: "getTokenLargestAccounts",
          params: [mint],
        }),
        next: { revalidate: 120 },
      } as RequestInit);
      const largest = await largestRes.json();

      // If the RPC returned an error payload (e.g. 429 in body), skip to next
      if (largest?.error) continue;

      const accounts: { address: string; uiAmount: number }[] =
        largest?.result?.value ?? [];
      if (!accounts.length) continue;

      // Step 2: resolve token-account pubkeys → owner wallet addresses
      const pubkeys = accounts.map((a) => a.address);
      const ownersRes = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: 2,
          method: "getMultipleAccounts",
          params: [pubkeys, { encoding: "jsonParsed" }],
        }),
        next: { revalidate: 120 },
      } as RequestInit);
      const ownersJson = await ownersRes.json();
      if (ownersJson?.error) continue;
      const ownerAccounts: unknown[] = ownersJson?.result?.value ?? [];

      type ParsedAccount = { data?: { parsed?: { info?: { owner?: string } } } } | null;
      const items = accounts
        .map((acc, i) => {
          const ownerAcc = ownerAccounts[i] as ParsedAccount;
          const owner = ownerAcc?.data?.parsed?.info?.owner ?? acc.address;
          return { owner, ui_amount: acc.uiAmount };
        })
        .filter((h) => h.owner && h.ui_amount > 0);

      if (!items.length) continue;

      return NextResponse.json(
        { success: true, data: { items } },
        { headers: { "Cache-Control": "s-maxage=120, stale-while-revalidate=240" } }
      );
    } catch {
      // Try next RPC endpoint
      continue;
    }
  }

  return NextResponse.json({ error: "no_holders", fallback: true });
}

// ─── Main GET handler ────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "trending";
  const path = ENDPOINTS[type];

  if (!path) {
    return NextResponse.json({ error: "Unknown endpoint" }, { status: 400 });
  }

  const key = apiKey();
  if (!key) {
    if (type === "holder") return getSolanaHolders(searchParams.get("address") ?? "");
    if (type === "trades") return getGeckoTrades(searchParams.get("address") ?? "");
    return NextResponse.json({ error: "no_key", fallback: true }, { status: 200 });
  }

  // Forward query params (minus our routing `type`).
  const forwarded = new URLSearchParams(searchParams);
  forwarded.delete("type");

  // BirdEye's ohlcv/history_price use a param also named `type` for candle
  // interval — callers pass it as `interval` and we remap it here.
  if (type === "ohlcv" || type === "history_price") {
    const interval = forwarded.get("interval");
    if (interval) {
      forwarded.delete("interval");
      forwarded.set("type", interval);
    }
  }
  const url = `${BIRDEYE}${path}${forwarded.toString() ? `?${forwarded}` : ""}`;

  const ttl = CACHE_TTL[type] ?? 30;

  try {
    const res = await fetch(url, {
      headers: {
        "X-API-KEY": key,
        "x-chain": "solana",
        accept: "application/json",
      },
      next: { revalidate: ttl },
    } as RequestInit);

    if (!res.ok) {
      // BirdEye HTTP error — fall back to free alternatives for key endpoints
      if (type === "holder") return getSolanaHolders(searchParams.get("address") ?? "");
      if (type === "trades") return getGeckoTrades(searchParams.get("address") ?? "");
      if (type === "ohlcv") return getGeckoOHLCV(
        searchParams.get("address") ?? "",
        searchParams.get("interval") ?? "1H",
        parseInt(searchParams.get("time_to") ?? "0")
      );
      return NextResponse.json({ error: `BirdEye ${res.status}`, fallback: true });
    }

    const data = await res.json();

    // BirdEye application-level failure (HTTP 200 but success:false — e.g.
    // "Compute units usage limit exceeded"). Fall back for key endpoints.
    if (data?.success === false) {
      if (type === "holder") return getSolanaHolders(searchParams.get("address") ?? "");
      if (type === "trades") return getGeckoTrades(searchParams.get("address") ?? "");
      if (type === "ohlcv") return getGeckoOHLCV(
        searchParams.get("address") ?? "",
        searchParams.get("interval") ?? "1H",
        parseInt(searchParams.get("time_to") ?? "0")
      );
      return NextResponse.json({ error: "birdeye_error", fallback: true });
    }

    const cacheHeader = `s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}`;
    return NextResponse.json(data, { headers: { "Cache-Control": cacheHeader } });
  } catch {
    return NextResponse.json({ error: "fetch_failed", fallback: true }, { status: 200 });
  }
}
