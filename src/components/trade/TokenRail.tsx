"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TokenLogo from "../ui/TokenLogo";
import PriceBadge from "../ui/PriceBadge";
import { formatPrice, compact } from "@/lib/format";
import { getTrendingTokens } from "@/lib/birdeye";
import type { Token } from "@/lib/types";

const FILTERS = ["Trending", "Gainers", "Most held"] as const;
type Filter = (typeof FILTERS)[number];

/**
 * Persistent left-hand token list for the trading terminal. Live trending data,
 * refreshed every 30s. Highlights the token currently being viewed.
 */
export default function TokenRail({ activeAddress }: { activeAddress: string }) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [filter, setFilter] = useState<Filter>("Trending");

  useEffect(() => {
    let active = true;
    const load = () =>
      getTrendingTokens().then((t) => {
        if (active) setTokens(t);
      });
    load();
    const id = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const view =
    filter === "Gainers"
      ? [...tokens].sort((a, b) => b.priceChange24h - a.priceChange24h)
      : filter === "Most held"
        ? [...tokens].sort((a, b) => (b.holders ?? 0) - (a.holders ?? 0))
        : tokens;

  return (
    <div className="glass flex h-full flex-col overflow-hidden p-0">
      <div className="flex items-center gap-1 border-b border-border p-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 rounded-[var(--radius-sm)] px-2 py-1.5 text-[12px] font-medium transition-colors ${
              filter === f ? "bg-bg-2 text-text-1" : "text-text-2 hover:text-text-1"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="custom-scrollbar flex-1 overflow-y-auto">
        {view.length === 0
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <div className="h-8 w-8 animate-pulse rounded-full bg-bg-2/50" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 w-16 animate-pulse rounded bg-bg-2/50" />
                  <div className="h-2 w-12 animate-pulse rounded bg-bg-2/40" />
                </div>
              </div>
            ))
          : view.map((t) => {
              const active = t.address === activeAddress;
              return (
                <Link
                  key={t.address}
                  href={`/trade/${t.address}`}
                  className={`flex items-center gap-3 border-l-2 px-3 py-2.5 transition-colors ${
                    active
                      ? "border-accent bg-bg-2/50"
                      : "border-transparent hover:bg-bg-2/30"
                  }`}
                >
                  <TokenLogo src={t.logoURI} symbol={t.symbol} size={30} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold">{t.symbol}</p>
                    <p className="font-mono text-[11px] text-text-2">
                      ${compact(t.marketCap)} MC
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[12px]">{formatPrice(t.price)}</p>
                    <div className="mt-0.5 flex justify-end">
                      <PriceBadge value={t.priceChange24h} showArrow={false} />
                    </div>
                  </div>
                </Link>
              );
            })}
      </div>
    </div>
  );
}
