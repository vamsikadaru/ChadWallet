import type { Token } from "./types";
import { MOCK_TOKENS, makeSparkline } from "./mock";

/**
 * Client-safe BirdEye access. Always routes through our own /api/birdeye
 * proxy so the API key stays server-side. Falls back to mock data when the
 * key is absent or a request fails — no blank screens, ever.
 */

interface BirdeyeRaw {
  address: string;
  name?: string;
  symbol: string;
  logoURI?: string;
  price?: number;
  v24hChangePercent?: number;
  priceChange24hPercent?: number;
  volume24hUSD?: number;
  v24hUSD?: number;
  liquidity?: number;
  mc?: number;
  marketcap?: number;
}

function normalize(raw: BirdeyeRaw, i: number): Token {
  const change = raw.priceChange24hPercent ?? raw.v24hChangePercent ?? 0;
  return {
    address: raw.address,
    name: raw.name ?? raw.symbol,
    symbol: raw.symbol,
    logoURI: raw.logoURI,
    price: raw.price ?? 0,
    priceChange24h: change,
    volume24h: raw.volume24hUSD ?? raw.v24hUSD ?? 0,
    marketCap: raw.mc ?? raw.marketcap ?? 0,
    liquidity: raw.liquidity,
    sparkline: makeSparkline(i + 1, 32, change >= 0),
  };
}

/** Absolute base so this works in both server and client contexts. */
function apiBase() {
  if (typeof window !== "undefined") return "";
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function getTrendingTokens(): Promise<Token[]> {
  try {
    const res = await fetch(
      `${apiBase()}/api/birdeye?type=trending&sort_by=rank&sort_type=asc&limit=20`,
      { next: { revalidate: 30 } }
    );
    const json = await res.json();
    if (json?.fallback || !json?.data?.tokens) return MOCK_TOKENS;
    const tokens: Token[] = json.data.tokens.map(normalize);
    return tokens.length ? tokens : MOCK_TOKENS;
  } catch {
    return MOCK_TOKENS;
  }
}

export async function getTokenOverview(address: string): Promise<Token | null> {
  try {
    const res = await fetch(
      `${apiBase()}/api/birdeye?type=token_overview&address=${address}`,
      { next: { revalidate: 30 } }
    );
    const json = await res.json();
    if (json?.fallback || !json?.data) {
      return MOCK_TOKENS.find((t) => t.address === address) ?? null;
    }
    return normalize(json.data, 0);
  } catch {
    return MOCK_TOKENS.find((t) => t.address === address) ?? null;
  }
}

export interface PricePoint {
  time: number; // unix seconds
  value: number; // usd
}

/** Birdeye `history_price` window presets keyed by UI range label. */
const HISTORY_WINDOWS: Record<
  string,
  { type: string; span: number /* seconds */ }
> = {
  "24H": { type: "15m", span: 24 * 3600 },
  "1W": { type: "1H", span: 7 * 86400 },
  "1M": { type: "4H", span: 30 * 86400 },
  "1Y": { type: "1D", span: 365 * 86400 },
  ALL: { type: "1W", span: 3 * 365 * 86400 },
};

/**
 * Real USD price history for a mint over a named range. Returns `[]` when the
 * key is missing or the request fails so callers can fall back gracefully.
 */
export async function getPriceHistory(
  address: string,
  range: string
): Promise<PricePoint[]> {
  const win = HISTORY_WINDOWS[range] ?? HISTORY_WINDOWS["1W"];
  const now = Math.floor(Date.now() / 1000);
  const from = now - win.span;
  try {
    const res = await fetch(
      `${apiBase()}/api/birdeye?type=history_price&address=${address}` +
        `&address_type=token&type=${win.type}&time_from=${from}&time_to=${now}`,
      { next: { revalidate: 60 } }
    );
    const json = await res.json();
    const items = json?.data?.items;
    if (json?.fallback || !Array.isArray(items)) return [];
    return items
      .map((i: { unixTime: number; value: number }) => ({
        time: i.unixTime,
        value: i.value,
      }))
      .filter((p: PricePoint) => isFinite(p.value) && p.value > 0);
  } catch {
    return [];
  }
}

/** Live USD prices for many mints in one call: `{ [mint]: usdPrice }`. */
export async function getMultiPrice(
  addresses: string[]
): Promise<Record<string, number>> {
  if (!addresses.length) return {};
  try {
    const res = await fetch(
      `${apiBase()}/api/birdeye?type=multi_price&list_address=${addresses.join(",")}`,
      { next: { revalidate: 30 } }
    );
    const json = await res.json();
    if (json?.fallback || !json?.data) return {};
    const out: Record<string, number> = {};
    for (const [mint, v] of Object.entries(
      json.data as Record<string, { value?: number }>
    )) {
      if (v && typeof v.value === "number") out[mint] = v.value;
    }
    return out;
  } catch {
    return {};
  }
}

export interface LiveTrade {
  id: string;
  side: "buy" | "sell";
  amountUsd: number;
  price: number;
  maker: string;
  timestamp: number; // ms
}

/**
 * Recent real swaps for a token. Birdeye's tx schema varies, so this parses
 * defensively and returns `[]` on any mismatch (callers fall back to a stream).
 */
export async function getTokenTrades(address: string): Promise<LiveTrade[]> {
  try {
    const res = await fetch(
      `${apiBase()}/api/birdeye?type=trades&address=${address}` +
        `&tx_type=swap&sort_type=desc&limit=20`,
      { next: { revalidate: 10 } }
    );
    const json = await res.json();
    const items = json?.data?.items;
    if (json?.fallback || !Array.isArray(items)) return [];
    return items
      .map((it: Record<string, unknown>, i: number): LiveTrade | null => {
        const side = it.side === "buy" || it.side === "sell" ? it.side : null;
        const ut =
          (it.blockUnixTime as number) ?? (it.block_unix_time as number) ?? 0;
        const usd =
          (it.volumeUSD as number) ??
          (it.volume_usd as number) ??
          (it.valueUSD as number) ??
          0;
        const price =
          (it.priceUSD as number) ?? (it.price as number) ?? 0;
        const owner =
          (it.owner as string) ?? (it.txHash as string) ?? `t${i}`;
        if (!side || !ut) return null;
        return {
          id: `${owner}-${ut}-${i}`,
          side,
          amountUsd: usd,
          price,
          maker: owner,
          timestamp: ut * 1000,
        };
      })
      .filter((t: LiveTrade | null): t is LiveTrade => t !== null);
  } catch {
    return [];
  }
}
