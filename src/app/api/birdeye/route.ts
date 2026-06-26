import { NextResponse } from "next/server";

const BIRDEYE = "https://public-api.birdeye.so";

/**
 * Server-side BirdEye proxy. The API key never reaches the client bundle.
 * Whitelisted endpoints only.
 *
 *   /api/birdeye?type=trending
 *   /api/birdeye?type=tokenlist
 *   /api/birdeye?type=ohlcv&address=<mint>&interval=1H&time_from=..&time_to=..
 *   /api/birdeye?type=token_overview&address=<mint>
 */
const ENDPOINTS: Record<string, string> = {
  trending: "/defi/token_trending",
  tokenlist: "/defi/tokenlist",
  ohlcv: "/defi/ohlcv",
  history_price: "/defi/history_price",
  token_overview: "/defi/token_overview",
  trades: "/defi/txs/token",
  price: "/defi/price",
  multi_price: "/defi/multi_price",
  holder: "/defi/v3/token/holder",
  search: "/defi/v3/search",
  security: "/defi/token_security",
  new_listing: "/defi/token_new_listing",
  top_traders: "/defi/v2/tokens/top_traders",
};

function apiKey() {
  return (
    process.env.BIRDEYE_API_KEY ||
    process.env.NEXT_PUBLIC_BIRDEYE_API_KEY ||
    ""
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "trending";
  const path = ENDPOINTS[type];

  if (!path) {
    return NextResponse.json({ error: "Unknown endpoint" }, { status: 400 });
  }

  const key = apiKey();
  if (!key) {
    // No key configured — signal callers to fall back to mock data.
    return NextResponse.json({ error: "no_key", fallback: true }, { status: 200 });
  }

  // Forward through any whitelisted query params (minus our own `type`).
  const forwarded = new URLSearchParams(searchParams);
  forwarded.delete("type");

  // BirdEye's ohlcv/history_price endpoints take their candle interval in a
  // param *also* named `type`, which collides with our routing `type`. Callers
  // pass it as `interval` and we remap it here so it survives the strip above.
  if (type === "ohlcv" || type === "history_price") {
    const interval = forwarded.get("interval");
    if (interval) {
      forwarded.delete("interval");
      forwarded.set("type", interval);
    }
  }
  const url = `${BIRDEYE}${path}${forwarded.toString() ? `?${forwarded}` : ""}`;

  try {
    const res = await fetch(url, {
      headers: {
        "X-API-KEY": key,
        "x-chain": "solana",
        accept: "application/json",
      },
      // Revalidate on the server; clients can poll on top of this.
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `BirdEye ${res.status}`, fallback: true },
        { status: 200 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json({ error: "fetch_failed", fallback: true }, { status: 200 });
  }
}
