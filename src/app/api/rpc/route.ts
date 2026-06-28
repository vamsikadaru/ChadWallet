import { NextResponse } from "next/server";

/**
 * Server-side Solana JSON-RPC proxy. The browser sends @solana/web3.js
 * requests here instead of hitting the public RPC directly, which avoids
 * browser-side CORS errors and rate-limits on the free public endpoint.
 *
 * Priority: Helius (if HELIUS_API_KEY is set) > public Solana mainnet
 */
function rpcEndpoint() {
  const helius = process.env.HELIUS_API_KEY;
  if (helius) return `https://mainnet.helius-rpc.com/?api-key=${helius}`;
  // Fall back to Solana Foundation public RPC (server-side calls are not
  // subject to the same browser rate-limits / CORS restrictions).
  return "https://api.mainnet-beta.solana.com";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch(rpcEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, no-cache" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "rpc_proxy_failed", message: String(err) },
      { status: 500 }
    );
  }
}
