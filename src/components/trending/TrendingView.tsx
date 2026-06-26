"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Zap } from "lucide-react";
import TokenLogo from "../ui/TokenLogo";
import PriceBadge from "../ui/PriceBadge";
import Sparkline from "../ui/Sparkline";
import HotStrip from "./HotStrip";
import { FadeIn } from "../ui/motion";
import { formatPrice, compact } from "@/lib/format";
import { getTrendingTokens, getCryptoTokens } from "@/lib/birdeye";
import type { Token } from "@/lib/types";

type MainTab = "Trending" | "Crypto";
type TrendFilter = "All" | "Gainers" | "Losers";

function TokenTable({ tokens, loading, emptyMsg }: { tokens: Token[]; loading: boolean; emptyMsg?: string }) {
  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center gap-2 text-[13px] text-text-3">
        <Loader2 size={14} className="animate-spin" /> Loading…
      </div>
    );
  }
  if (!tokens.length) {
    return (
      <div className="flex h-48 items-center justify-center text-[13px] text-text-3">
        {emptyMsg ?? "No tokens found"}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr className="border-b border-border">
            {["#", "Token", "Price", "24h", "Volume", "Market Cap", "7d", ""].map((h, i) => (
              <th
                key={h + i}
                className={`caps px-4 py-3 font-medium ${
                  i >= 2 && i <= 5 ? "text-right" : "text-left"
                } ${i === 6 ? "text-center" : ""}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tokens.map((t, i) => (
            <motion.tr
              key={t.address}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.02, 0.3) }}
              className="group border-b border-border/60 transition-colors last:border-0 hover:bg-bg-2/40"
            >
              <td className="px-4 py-3 font-mono text-[13px] text-text-3">{i + 1}</td>
              <td className="px-4 py-3">
                <Link href={`/trade/${t.address}`} className="flex items-center gap-3">
                  <TokenLogo src={t.logoURI} symbol={t.symbol} size={32} />
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold transition-colors group-hover:text-accent">
                      {t.name}
                    </p>
                    <p className="font-mono text-[11px] text-text-2">{t.symbol}</p>
                  </div>
                </Link>
              </td>
              <td className="px-4 py-3 text-right font-mono text-[13px]">{formatPrice(t.price)}</td>
              <td className="px-4 py-3 text-right">
                <PriceBadge value={t.priceChange24h} showArrow={false} />
              </td>
              <td className="px-4 py-3 text-right font-mono text-[13px] text-text-2">
                {t.volume24h > 0 ? `$${compact(t.volume24h)}` : "—"}
              </td>
              <td className="px-4 py-3 text-right font-mono text-[13px] text-text-2">
                {t.marketCap > 0 ? `$${compact(t.marketCap)}` : "—"}
              </td>
              <td className="px-4 py-3">
                <div className="mx-auto w-[88px]">
                  <Sparkline data={t.sparkline ?? []} positive={t.priceChange24h >= 0} height={32} />
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
  );
}

export default function TrendingView({ initial = [] }: { initial?: Token[] }) {
  const [trendingTokens, setTrendingTokens] = useState<Token[]>(initial);
  const [cryptoTokens, setCryptoTokens] = useState<Token[]>([]);
  const [mainTab, setMainTab] = useState<MainTab>("Trending");
  const [trendFilter, setTrendFilter] = useState<TrendFilter>("All");
  const [cryptoLoading, setCryptoLoading] = useState(false);
  const [pulse, setPulse] = useState(false);

  // Fetch on mount, then refresh every 30s.
  useEffect(() => {
    getTrendingTokens().then(setTrendingTokens);
    const id = setInterval(async () => {
      const next = await getTrendingTokens();
      setTrendingTokens(next);
      setPulse(true);
      setTimeout(() => setPulse(false), 1200);
    }, 30000);
    return () => clearInterval(id);
  }, []);

  // Fetch Crypto tokens the first time that tab is opened.
  useEffect(() => {
    if (mainTab !== "Crypto" || cryptoTokens.length) return;
    setCryptoLoading(true);
    getCryptoTokens().then((t) => { setCryptoTokens(t); setCryptoLoading(false); });
  }, [mainTab, cryptoTokens.length]);

  const filteredTrending = useMemo(() => {
    switch (trendFilter) {
      case "Gainers":
        return [...trendingTokens].filter((t) => t.priceChange24h >= 0).sort((a, b) => b.priceChange24h - a.priceChange24h);
      case "Losers":
        return [...trendingTokens].filter((t) => t.priceChange24h < 0).sort((a, b) => a.priceChange24h - b.priceChange24h);
      default:
        return trendingTokens;
    }
  }, [trendingTokens, trendFilter]);

  return (
    <div className="space-y-7">
      <FadeIn>
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="caps">Markets</p>
              <span className={`live-dot h-1.5 w-1.5 rounded-full transition-colors ${pulse ? "bg-accent-2" : "bg-success"}`} />
            </div>
            <h1 className="font-display text-[28px] font-bold tracking-tight">
              {mainTab === "Crypto" ? "Major Tokens" : "Trending on Solana"}
            </h1>
          </div>
        </div>
      </FadeIn>

      {mainTab === "Trending" && (
        <FadeIn delay={0.05}>
          <HotStrip tokens={trendingTokens} />
        </FadeIn>
      )}

      <FadeIn delay={0.1}>
        <div className="flex items-center gap-1 rounded-[var(--radius-pill)] border border-border bg-bg-1 p-1">
          {(["Trending", "Crypto"] as MainTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setMainTab(t)}
              className={`rounded-[var(--radius-pill)] px-4 py-1.5 text-[13px] font-medium transition-colors ${
                mainTab === t ? "bg-bg-2 text-text-1" : "text-text-2 hover:text-text-1"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {mainTab === "Trending" && (
          <div className="mt-2 flex items-center gap-1">
            {(["All", "Gainers", "Losers"] as TrendFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setTrendFilter(f)}
                className={`rounded-[var(--radius-pill)] px-3 py-1 text-[12px] font-medium transition-colors ${
                  trendFilter === f ? "text-text-1 underline underline-offset-4" : "text-text-3 hover:text-text-2"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </FadeIn>

      <FadeIn delay={0.15}>
        <div className="glass overflow-hidden p-0">
          {mainTab === "Trending" ? (
            <TokenTable tokens={filteredTrending} loading={false} />
          ) : (
            <TokenTable tokens={cryptoTokens} loading={cryptoLoading} emptyMsg="Could not load major tokens" />
          )}
        </div>
      </FadeIn>
    </div>
  );
}
