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
