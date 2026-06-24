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
  // 24h price change is named differently across endpoints:
  priceChange24hPercent?: number; // token_overview
  price24hChangePercent?: number; // token_trending
  v24hChangePercent?: number;
  priceChange5mPercent?: number;
  priceChange1hPercent?: number;
  priceChange4hPercent?: number;
  // Volume:
  volume24hUSD?: number; // token_trending
  v24hUSD?: number; // token_overview
  // Market cap is `marketCap` (overview), `marketcap` (trending), or `mc`:
  marketCap?: number;
  marketcap?: number;
  mc?: number;
  realMc?: number;
  fdv?: number;
  liquidity?: number;
  holder?: number;
  buy24h?: number;
  sell24h?: number;
  vBuy24hUSD?: number;
  vSell24hUSD?: number;
  supply?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  extensions?: { description?: string };
}

function normalize(raw: BirdeyeRaw, i: number): Token {
  const change =
    raw.priceChange24hPercent ??
    raw.price24hChangePercent ??
    raw.v24hChangePercent ??
    0;
  const volume =
    raw.volume24hUSD ??
    raw.v24hUSD ??
    (raw.vBuy24hUSD != null || raw.vSell24hUSD != null
      ? (raw.vBuy24hUSD ?? 0) + (raw.vSell24hUSD ?? 0)
      : 0);
  return {
    address: raw.address,
    name: raw.name ?? raw.symbol,
    symbol: raw.symbol,
    logoURI: raw.logoURI,
    price: raw.price ?? 0,
    priceChange24h: change,
    volume24h: volume,
    marketCap: raw.marketCap ?? raw.marketcap ?? raw.mc ?? raw.realMc ?? raw.fdv ?? 0,
    liquidity: raw.liquidity,
    sparkline: makeSparkline(i + 1, 32, change >= 0),
    holders: raw.holder,
    buys24h: raw.buy24h,
    sells24h: raw.sell24h,
    vBuy24h: raw.vBuy24hUSD,
    vSell24h: raw.vSell24hUSD,
    change5m: raw.priceChange5mPercent,
    change1h: raw.priceChange1hPercent,
    change4h: raw.priceChange4hPercent,
    supply: raw.circulatingSupply ?? raw.totalSupply ?? raw.supply,
    description: raw.extensions?.description,
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

interface SearchHit {
  address: string;
  name?: string;
  symbol?: string;
  logo_uri?: string;
  price?: number;
  price_change_24h_percent?: number;
  volume_24h_usd?: number;
  market_cap?: number;
  fdv?: number;
  liquidity?: number;
  verified?: boolean;
}

/**
 * Keyword search across all Solana tokens (name / symbol), via BirdEye's
 * `/defi/v3/search`. Verified tokens are surfaced first; results are already
 * ranked by 24h volume. Returns `[]` on failure so the UI can fall back.
 */
export async function searchTokens(keyword: string): Promise<Token[]> {
  const q = keyword.trim();
  if (!q) return [];
  try {
    const res = await fetch(
      `${apiBase()}/api/birdeye?type=search&chain=solana&keyword=${encodeURIComponent(q)}` +
        `&target=token&sort_by=volume_24h_usd&sort_type=desc&offset=0&limit=12`,
      { next: { revalidate: 30 } }
    );
    const json = await res.json();
    if (json?.fallback || !json?.data?.items) return [];
    const group = (json.data.items as { type: string; result?: SearchHit[] }[]).find(
      (it) => it.type === "token"
    );
    const hits = group?.result ?? [];
    const tokens = hits
      .filter((h) => h.address && (h.price ?? 0) > 0)
      .map(
        (h, i): Token => ({
          address: h.address,
          name: h.name ?? h.symbol ?? "",
          symbol: h.symbol ?? "",
          logoURI: h.logo_uri,
          price: h.price ?? 0,
          priceChange24h: h.price_change_24h_percent ?? 0,
          volume24h: h.volume_24h_usd ?? 0,
          marketCap: h.market_cap ?? h.fdv ?? 0,
          liquidity: h.liquidity,
          sparkline: makeSparkline(i + 1, 24, (h.price_change_24h_percent ?? 0) >= 0),
        })
      );
    // Verified tokens first, preserving BirdEye's volume ordering within groups.
    const verified = hits.filter((h) => h.verified).map((h) => h.address);
    return tokens.sort(
      (a, b) =>
        (verified.includes(b.address) ? 1 : 0) -
        (verified.includes(a.address) ? 1 : 0)
    );
  } catch {
    return [];
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
/**
 * Quantize the time window to 60s buckets so the same URL is reused for a
 * minute — letting the CDN / Next cache absorb repeat requests instead of
 * hammering BirdEye (and tripping the free-tier rate limit) on every render.
 */
function window60(span: number): { from: number; to: number } {
  const to = Math.floor(Date.now() / 1000 / 60) * 60;
  return { from: to - span, to };
}

export async function getPriceHistory(
  address: string,
  range: string
): Promise<PricePoint[]> {
  const win = HISTORY_WINDOWS[range] ?? HISTORY_WINDOWS["1W"];
  const { from, to: now } = window60(win.span);
  try {
    const res = await fetch(
      `${apiBase()}/api/birdeye?type=history_price&address=${address}` +
        `&address_type=token&interval=${win.type}&time_from=${from}&time_to=${now}`,
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

export interface Candle {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** OHLCV candle windows keyed by UI range → BirdEye candle interval + span. */
const OHLCV_WINDOWS: Record<string, { interval: string; span: number }> = {
  "1D": { interval: "15m", span: 86400 },
  "1W": { interval: "1H", span: 7 * 86400 },
  "1M": { interval: "4H", span: 30 * 86400 },
  "3M": { interval: "12H", span: 90 * 86400 },
  "1Y": { interval: "1D", span: 365 * 86400 },
};

/** Real OHLC candles + volume for a mint over a named range. `[]` on failure. */
export async function getOHLCV(
  address: string,
  range: string
): Promise<Candle[]> {
  const win = OHLCV_WINDOWS[range] ?? OHLCV_WINDOWS["1W"];
  const { from, to: now } = window60(win.span);
  try {
    const res = await fetch(
      `${apiBase()}/api/birdeye?type=ohlcv&address=${address}` +
        `&interval=${win.interval}&time_from=${from}&time_to=${now}`,
      { next: { revalidate: 30 } }
    );
    const json = await res.json();
    const items = json?.data?.items;
    if (json?.fallback || !Array.isArray(items)) return [];
    return items
      .map(
        (i: {
          unixTime: number;
          o: number;
          h: number;
          l: number;
          c: number;
          v: number;
        }): Candle => ({
          time: i.unixTime,
          open: i.o,
          high: i.h,
          low: i.l,
          close: i.c,
          volume: i.v ?? 0,
        })
      )
      .filter((c: Candle) => isFinite(c.close) && c.close > 0);
  } catch {
    return [];
  }
}

/** Synthesize candles from a price line (open = previous close). Volume 0. */
function lineToCandles(points: PricePoint[]): Candle[] {
  return points.map((p, i) => {
    const open = i > 0 ? points[i - 1].value : p.value;
    const close = p.value;
    return {
      time: p.time,
      open,
      high: Math.max(open, close),
      low: Math.min(open, close),
      close,
      volume: 0,
    };
  });
}

/**
 * Resilient candle fetch for the chart. Tries OHLCV, retries once on a
 * transient empty (rate limit), then falls back to deriving candles from the
 * price-history line — so a token with *any* data never shows a blank chart.
 */
export async function getCandles(
  address: string,
  range: string
): Promise<Candle[]> {
  const candles = await getOHLCV(address, range);
  if (candles.length) return candles;

  // OHLCV empty (new/illiquid token or a transient miss) — derive candles from
  // the price-history line so anything with price data still renders.
  const win = OHLCV_WINDOWS[range] ?? OHLCV_WINDOWS["1W"];
  const { from, to } = window60(win.span);
  try {
    const res = await fetch(
      `${apiBase()}/api/birdeye?type=history_price&address=${address}` +
        `&address_type=token&interval=${win.interval}&time_from=${from}&time_to=${to}`,
      { next: { revalidate: 60 } }
    );
    const json = await res.json();
    const items = json?.data?.items;
    if (json?.fallback || !Array.isArray(items)) return [];
    const line = items
      .map((i: { unixTime: number; value: number }) => ({
        time: i.unixTime,
        value: i.value,
      }))
      .filter((p: PricePoint) => isFinite(p.value) && p.value > 0);
    return lineToCandles(line);
  } catch {
    return [];
  }
}

export interface TokenHolder {
  address: string;
  amount: number;
  pct: number; // % of supply (0 when supply unknown)
}

/** Top holders for a mint. `supply` lets us compute supply share. `[]` on fail. */
export async function getTokenHolders(
  address: string,
  supply?: number
): Promise<TokenHolder[]> {
  try {
    const res = await fetch(
      `${apiBase()}/api/birdeye?type=holder&address=${address}&offset=0&limit=20`,
      { next: { revalidate: 60 } }
    );
    const json = await res.json();
    const items = json?.data?.items;
    if (json?.fallback || !Array.isArray(items)) return [];
    return items
      .map((it: Record<string, unknown>): TokenHolder => {
        const amount =
          (it.ui_amount as number) ??
          (it.uiAmount as number) ??
          Number(it.amount) ??
          0;
        return {
          address: (it.owner as string) ?? (it.address as string) ?? "",
          amount,
          pct: supply && supply > 0 ? (amount / supply) * 100 : 0,
        };
      })
      .filter((h: TokenHolder) => h.address);
  } catch {
    return [];
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
interface TxSide {
  address?: string;
  uiAmount?: number;
  price?: number;
}

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
        const ut = (it.blockUnixTime as number) ?? 0;
        if (!side || !ut) return null;
        const from = (it.from as TxSide) ?? {};
        const to = (it.to as TxSide) ?? {};
        const quote = (it.quote as TxSide) ?? {};
        const base = (it.base as TxSide) ?? {};
        // USD value of the swap (either leg works; they net out).
        const usd =
          Math.abs((from.uiAmount ?? 0) * (from.price ?? 0)) ||
          Math.abs((to.uiAmount ?? 0) * (to.price ?? 0));
        // Price of the token this page is about.
        const price =
          quote.address === address
            ? quote.price ?? 0
            : base.address === address
              ? base.price ?? 0
              : (it.quotePrice as number) ?? 0;
        const owner = (it.owner as string) ?? (it.txHash as string) ?? `t${i}`;
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

/** Single live price + 24h change via the lightweight `/defi/price` endpoint. */
export async function getPrice(
  address: string
): Promise<{ value: number; change24h: number } | null> {
  try {
    const res = await fetch(
      `${apiBase()}/api/birdeye?type=price&address=${address}`,
      { next: { revalidate: 20 } }
    );
    const json = await res.json();
    const data = json?.data;
    if (json?.fallback || !data || typeof data.value !== "number") return null;
    return { value: data.value, change24h: data.priceChange24h ?? 0 };
  } catch {
    return null;
  }
}
