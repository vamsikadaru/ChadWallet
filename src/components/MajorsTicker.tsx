"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPrice } from "@/lib/birdeye";
import { formatPrice, formatPct } from "@/lib/format";

const MAJORS: { symbol: string; mint: string }[] = [
  { symbol: "SOL",  mint: "So11111111111111111111111111111111111111112" },
  { symbol: "JUP",  mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" },
  { symbol: "BONK", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
  { symbol: "WIF",  mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm" },
  { symbol: "JTO",  mint: "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL" },
];

interface Quote { value: number; change24h: number; }

export default function MajorsTicker() {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});

  useEffect(() => {
    let active = true;
    const load = async () => {
      for (const m of MAJORS) {
        const q = await getPrice(m.mint);
        if (!active) return;
        if (q) setQuotes((prev) => ({ ...prev, [m.mint]: q }));
      }
    };
    load();
    const id = setInterval(load, 60000);
    return () => { active = false; clearInterval(id); };
  }, []);

  return (
    <div className="hidden shrink-0 items-center justify-between border-t border-bg-tertiary bg-bg-secondary px-4 lg:flex" style={{ height: 32 }}>
      {/* Prices */}
      <div className="no-scrollbar flex items-center gap-5 overflow-x-auto">
        {MAJORS.map((m) => {
          const q = quotes[m.mint];
          const up = (q?.change24h ?? 0) >= 0;
          return (
            <Link
              key={m.symbol}
              href={`/trade/${m.mint}`}
              className="flex shrink-0 items-center gap-1.5 font-mono text-[11px] transition-opacity hover:opacity-70"
            >
              <span className="text-text-secondary">{m.symbol}</span>
              <span className="text-text-primary">{q ? formatPrice(q.value) : "—"}</span>
              {q && (
                <span style={{ color: up ? "var(--success)" : "var(--danger)" }}>
                  {formatPct(q.change24h)}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Right side: Stable + links */}
      <div className="flex shrink-0 items-center gap-4">
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-text-secondary">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--success)" }} />
          Stable
        </span>
        <div className="flex items-center gap-3 text-[11px] text-text-tertiary">
          <a href="/privacy" className="transition-colors hover:text-text-secondary">Privacy</a>
          <a href="/terms"   className="transition-colors hover:text-text-secondary">Terms</a>
          <a href="/help"    className="transition-colors hover:text-text-secondary">Help</a>
        </div>
      </div>
    </div>
  );
}
