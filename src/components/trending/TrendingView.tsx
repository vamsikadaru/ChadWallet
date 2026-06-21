"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import TokenLogo from "../ui/TokenLogo";
import PriceBadge from "../ui/PriceBadge";
import Sparkline from "../ui/Sparkline";
import HotStrip from "./HotStrip";
import { FadeIn } from "../ui/motion";
import { formatPrice, compact } from "@/lib/format";
import { getTrendingTokens } from "@/lib/birdeye";
import type { Token } from "@/lib/types";

const FILTERS = ["All", "Gainers", "Losers", "New"] as const;
type Filter = (typeof FILTERS)[number];

export default function TrendingView({ initial }: { initial: Token[] }) {
  const [tokens, setTokens] = useState<Token[]>(initial);
  const [filter, setFilter] = useState<Filter>("All");
  const [pulse, setPulse] = useState(false);
  const firstLoad = useRef(true);

  // Refresh every 30s with a subtle pulse on update.
  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    const id = setInterval(async () => {
      const next = await getTrendingTokens();
      setTokens(next);
      setPulse(true);
      setTimeout(() => setPulse(false), 1200);
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    switch (filter) {
      case "Gainers":
        return [...tokens]
          .filter((t) => t.priceChange24h >= 0)
          .sort((a, b) => b.priceChange24h - a.priceChange24h);
      case "Losers":
        return [...tokens]
          .filter((t) => t.priceChange24h < 0)
          .sort((a, b) => a.priceChange24h - b.priceChange24h);
      case "New":
        return [...tokens].sort((a, b) => (a.marketCap ?? 0) - (b.marketCap ?? 0));
      default:
        return tokens;
    }
  }, [tokens, filter]);

  return (
    <div className="space-y-7">
      <FadeIn>
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="caps">Markets</p>
              <span
                className={`live-dot h-1.5 w-1.5 rounded-full transition-colors ${
                  pulse ? "bg-accent-2" : "bg-success"
                }`}
              />
            </div>
            <h1 className="font-display text-[28px] font-bold tracking-tight">
              Trending on Solana
            </h1>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <HotStrip tokens={tokens} />
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="flex items-center gap-1 rounded-[var(--radius-pill)] border border-border bg-bg-1 p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-[var(--radius-pill)] px-4 py-1.5 text-[13px] font-medium transition-colors ${
                filter === f ? "bg-bg-2 text-text-1" : "text-text-2 hover:text-text-1"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={0.15}>
        <div className="glass overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {["#", "Token", "Price", "24h", "Volume", "Market Cap", "7d", ""].map(
                    (h, i) => (
                      <th
                        key={h + i}
                        className={`caps px-4 py-3 font-medium ${
                          i >= 2 && i <= 5 ? "text-right" : "text-left"
                        } ${i === 6 ? "text-center" : ""}`}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <motion.tr
                    key={t.address}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    className="group border-b border-border/60 transition-colors last:border-0 hover:bg-bg-2/40"
                  >
                    <td className="px-4 py-3 font-mono text-[13px] text-text-3">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/trade/${t.address}`}
                        className="flex items-center gap-3"
                      >
                        <TokenLogo src={t.logoURI} symbol={t.symbol} size={32} />
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-semibold transition-colors group-hover:text-accent">
                            {t.name}
                          </p>
                          <p className="font-mono text-[11px] text-text-2">
                            {t.symbol}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[13px]">
                      {formatPrice(t.price)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <PriceBadge value={t.priceChange24h} showArrow={false} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[13px] text-text-2">
                      ${compact(t.volume24h)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[13px] text-text-2">
                      ${compact(t.marketCap)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="mx-auto w-[88px]">
                        <Sparkline
                          data={t.sparkline ?? []}
                          positive={t.priceChange24h >= 0}
                          height={32}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/trade/${t.address}`}
                        className="btn-buy inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-3 py-1.5 text-[12px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Zap size={12} /> Buy
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
