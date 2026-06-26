"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMultiQuote } from "@/lib/birdeye";
import { formatPrice, formatPct } from "@/lib/format";

/** Solana-native majors shown live in the desktop status bar. */
const MAJORS: { symbol: string; mint: string }[] = [
  { symbol: "SOL", mint: "So11111111111111111111111111111111111111112" },
  { symbol: "JUP", mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" },
  { symbol: "BONK", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
  { symbol: "WIF", mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm" },
  { symbol: "JTO", mint: "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL" },
];

interface Quote {
  value: number;
  change24h: number;
}

export default function MajorsTicker() {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});

  useEffect(() => {
    let active = true;
    const load = async () => {
      const data = await getMultiQuote(MAJORS.map((m) => m.mint));
      if (!active) return;
      setQuotes((prev) => ({ ...prev, ...data }));
    };
    load();
    const id = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 hidden h-8 items-center justify-between border-t border-border bg-bg-0/90 px-4 backdrop-blur-xl lg:flex"
      style={{ left: "248px" }}
    >
      <div className="no-scrollbar flex items-center gap-5 overflow-x-auto">
        {MAJORS.map((m) => {
          const q = quotes[m.mint];
          const up = (q?.change24h ?? 0) >= 0;
          return (
            <Link
              key={m.symbol}
              href={`/trade/${m.mint}`}
              className="flex shrink-0 items-center gap-1.5 font-mono text-[11px] transition-colors hover:opacity-80"
            >
              <span className="text-text-2">{m.symbol}</span>
              <span className="text-text-1">
                {q ? formatPrice(q.value) : "—"}
              </span>
              {q && (
                <span style={{ color: up ? "var(--success)" : "var(--danger)" }}>
                  {formatPct(q.change24h)}
                </span>
              )}
            </Link>
          );
        })}
      </div>
      <div className="flex items-center gap-4 text-[11px] text-text-3">
        <span className="flex items-center gap-1.5">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-success" /> Live
        </span>
        <span className="hidden xl:inline">Solana mainnet</span>
      </div>
    </div>
  );
}
