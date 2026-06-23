"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import TokenLogo from "@/components/ui/TokenLogo";
import PriceBadge from "@/components/ui/PriceBadge";
import Skeleton from "@/components/ui/Skeleton";
import SectionBoundary from "@/components/SectionBoundary";
import { FadeIn } from "@/components/ui/motion";
import TradePanel from "@/components/trade/TradePanel";
import { LiveTrades, HoldersList } from "@/components/trade/LiveFeed";
import { getTokenOverview, getPriceHistory } from "@/lib/birdeye";
import { MOCK_TOKENS, mockChartSeries } from "@/lib/mock";
import { formatPrice, compact, truncateAddress } from "@/lib/format";
import type { Token } from "@/lib/types";
import type { ChartPoint } from "@/components/TradingChart";

const TradingChart = dynamic(() => import("@/components/TradingChart"), {
  ssr: false,
  loading: () => <Skeleton className="h-[360px] w-full" />,
});

const TIMEFRAMES = ["5m", "1h", "4h", "1D", "1W"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

export default function TradePage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = use(params);
  const [token, setToken] = useState<Token | null>(
    MOCK_TOKENS.find((t) => t.address === address) ?? null
  );
  const [loading, setLoading] = useState(!token);
  const [tf, setTf] = useState<Timeframe>("1D");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getTokenOverview(address).then((t) => {
      if (!active) return;
      if (t) setToken(t);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [address]);

  // Each timeframe maps to a real Birdeye history window; fall back to a
  // generated series only if the live request comes back empty.
  const fallback = useMemo(() => {
    const cfg: Record<Timeframe, [number, number]> = {
      "5m": [60, 1],
      "1h": [60, 2],
      "4h": [60, 3],
      "1D": [90, 4],
      "1W": [120, 5],
    };
    const [days, seed] = cfg[tf];
    return mockChartSeries(days, seed);
  }, [tf]);

  // Cache of fetched live history keyed by token+timeframe. Until a window's
  // real data arrives we render the generated fallback for that window.
  const [history, setHistory] = useState<Record<string, ChartPoint[]>>({});
  const histKey = `${address}-${tf}`;

  useEffect(() => {
    let active = true;
    const range: Record<Timeframe, string> = {
      "5m": "24H",
      "1h": "1W",
      "4h": "1M",
      "1D": "1Y",
      "1W": "ALL",
    };
    getPriceHistory(address, range[tf]).then((points) => {
      if (!active || points.length < 2) return;
      setHistory((m) => ({
        ...m,
        [`${address}-${tf}`]: points.map((p) => ({
          time: p.time,
          value: p.value,
        })),
      }));
    });
    return () => {
      active = false;
    };
  }, [address, tf]);

  const series = history[histKey] ?? fallback;

  const display: Token =
    token ?? {
      address,
      name: "Unknown Token",
      symbol: address.slice(0, 4).toUpperCase(),
      price: 0,
      priceChange24h: 0,
      volume24h: 0,
      marketCap: 0,
    };

  const stats = [
    { label: "Market Cap", value: `$${compact(display.marketCap)}` },
    { label: "24h Volume", value: `$${compact(display.volume24h)}` },
    {
      label: "Liquidity",
      value: `$${compact(display.liquidity ?? display.volume24h * 0.3)}`,
    },
    { label: "Holders", value: compact(18420) },
  ];

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      <FadeIn>
        <Link
          href="/trending"
          className="caps inline-flex items-center gap-1.5 text-text-2 transition-colors hover:text-text-1"
        >
          <ArrowLeft size={13} /> Markets
        </Link>
      </FadeIn>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart + data column */}
        <div className="space-y-6 lg:col-span-2">
          <FadeIn delay={0.05}>
            <div className="glass p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TokenLogo src={display.logoURI} symbol={display.symbol} size={44} />
                  <div>
                    {loading ? (
                      <Skeleton className="h-5 w-28" />
                    ) : (
                      <h1 className="font-display text-[20px] font-bold leading-tight">
                        {display.name}
                      </h1>
                    )}
                    <p className="font-mono text-[12px] text-text-2">
                      {display.symbol} · {truncateAddress(display.address)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[22px] font-semibold tracking-tight">
                    {formatPrice(display.price)}
                  </p>
                  <div className="mt-1 flex justify-end">
                    <PriceBadge value={display.priceChange24h} />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-1 rounded-[var(--radius-pill)] border border-border bg-bg-0/50 p-1">
                {TIMEFRAMES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTf(t)}
                    className={`rounded-[var(--radius-pill)] px-3 py-1 font-mono text-[12px] transition-colors ${
                      tf === t ? "bg-bg-2 text-text-1" : "text-text-2 hover:text-text-1"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <SectionBoundary label="chart">
                  <TradingChart data={series} />
                </SectionBoundary>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="glass p-4">
                  <p className="caps">{s.label}</p>
                  <p className="mt-1.5 font-mono text-[15px] font-medium">{s.value}</p>
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SectionBoundary label="live trades">
                <LiveTrades address={display.address} />
              </SectionBoundary>
              <SectionBoundary label="holders">
                <HoldersList />
              </SectionBoundary>
            </div>
          </FadeIn>
        </div>

        {/* Trade panel — sticky sidebar on desktop */}
        <div className="hidden lg:col-span-1 lg:block">
          <FadeIn delay={0.1}>
            <div className="sticky top-8">
              <SectionBoundary label="trade panel">
                <TradePanel token={display} />
              </SectionBoundary>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Mobile: floating Trade button + bottom-sheet drawer */}
      <div className="fixed inset-x-0 bottom-[72px] z-30 px-4 lg:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          className="btn-buy flex h-[52px] w-full items-center justify-center rounded-[var(--radius-md)] text-[15px] font-bold text-white shadow-lg"
        >
          Trade {display.symbol}
        </button>
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="absolute inset-x-0 bottom-0 rounded-t-[var(--radius-lg)] border-t border-border bg-bg-1 p-4 pb-8"
            >
              <div className="relative mb-4 flex items-center justify-center">
                <span className="h-1 w-10 rounded-full bg-bg-2" />
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="absolute right-0 top-0 text-text-2"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <TradePanel token={display} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
