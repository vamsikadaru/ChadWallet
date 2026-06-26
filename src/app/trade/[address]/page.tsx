"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, X, Loader2 } from "lucide-react";
import TokenLogo from "@/components/ui/TokenLogo";
import PriceBadge from "@/components/ui/PriceBadge";
import Skeleton from "@/components/ui/Skeleton";
import SectionBoundary from "@/components/SectionBoundary";
import { FadeIn } from "@/components/ui/motion";
import TradePanel from "@/components/trade/TradePanel";
import TradeRail from "@/components/trade/TokenRail";
import TokenStats from "@/components/trade/TokenStats";
import { LiveTrades, HoldersList } from "@/components/trade/LiveFeed";
import { getTokenOverview, getCandles, getTokenSecurity, type Candle } from "@/lib/birdeye";
import { MOCK_TOKENS } from "@/lib/mock";
import { formatPrice, compact, truncateAddress } from "@/lib/format";
import type { Token, TokenSecurity } from "@/lib/types";

const TradingChart = dynamic(() => import("@/components/TradingChart"), {
  ssr: false,
  loading: () => <Skeleton className="h-[360px] w-full" />,
});

const RANGES = ["1D", "1W", "1M", "3M", "1Y"] as const;
type Range = (typeof RANGES)[number];
type Tab = "swaps" | "holders";

function riskLevel(sec: TokenSecurity): "safe" | "caution" | "risky" {
  if (sec.mintAuthority) return "risky";
  if (sec.freezeAuthority || sec.top10HolderPercent > 50) return "risky";
  if (sec.top10HolderPercent > 25) return "caution";
  return "safe";
}

function SecurityBadge({ sec }: { sec: TokenSecurity }) {
  const level = riskLevel(sec);
  const cfg = {
    safe:    { label: "Safe",    color: "var(--success)", bg: "rgba(20,241,149,0.1)" },
    caution: { label: "Caution", color: "#F59E0B",        bg: "rgba(245,158,11,0.1)" },
    risky:   { label: "Risky",   color: "var(--danger)",  bg: "rgba(255,75,75,0.1)" },
  }[level];

  const lines = [
    sec.mintAuthority   ? "⚠ Mint authority active" : "✓ No mint authority",
    sec.freezeAuthority ? "⚠ Freeze authority active" : "✓ No freeze authority",
    `Top-10 holders: ${sec.top10HolderPercent.toFixed(1)}%`,
  ];

  return (
    <div className="group relative">
      <span
        className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2 py-0.5 font-mono text-[11px] font-semibold cursor-default"
        style={{ color: cfg.color, background: cfg.bg }}
      >
        {level === "safe" ? "✓" : "⚠"} {cfg.label}
      </span>
      <div className="pointer-events-none absolute left-0 top-full z-20 mt-1.5 hidden min-w-[200px] rounded-[var(--radius-md)] border border-border bg-bg-1 p-3 text-[12px] shadow-xl group-hover:block">
        {lines.map((l) => (
          <p key={l} className="text-text-2">{l}</p>
        ))}
      </div>
    </div>
  );
}

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
  const [security, setSecurity] = useState<TokenSecurity | null>(null);
  const [range, setRange] = useState<Range>("1D");
  const [denom, setDenom] = useState<"price" | "mcap">("price");
  const [tab, setTab] = useState<Tab>("swaps");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getTokenOverview(address).then((t) => {
      if (!active) return;
      if (t) setToken(t);
      setLoading(false);
    });
    const id = setInterval(() => {
      getTokenOverview(address).then((t) => {
        if (active && t) setToken(t);
      });
    }, 20000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [address]);

  useEffect(() => {
    let active = true;
    getTokenSecurity(address).then((s) => { if (active) setSecurity(s); });
    return () => { active = false; };
  }, [address]);

  // Live OHLCV candles, cached per token+range. A key lands in `emptyKeys` only
  // after retries are exhausted, so transient rate-limit misses keep showing a
  // loading state (and auto-recover) instead of a misleading "no data".
  const [candleCache, setCandleCache] = useState<Record<string, Candle[]>>({});
  const [emptyKeys, setEmptyKeys] = useState<Set<string>>(new Set());
  const candleKey = `${address}-${range}`;

  useEffect(() => {
    if (candleCache[candleKey]) return; // already loaded — instant on re-switch
    let active = true;
    let attempts = 0;
    const key = candleKey;

    const tryFetch = () => {
      getCandles(address, range).then((c) => {
        if (!active) return;
        if (c.length) {
          setCandleCache((m) => ({ ...m, [key]: c }));
          setEmptyKeys((s) => {
            if (!s.has(key)) return s;
            const n = new Set(s);
            n.delete(key);
            return n;
          });
        } else if (attempts < 3) {
          attempts += 1;
          setTimeout(tryFetch, 1500); // back off, let rate-limit clear
        } else {
          setEmptyKeys((s) => new Set(s).add(key));
        }
      });
    };
    tryFetch();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, range]);

  const candles = candleCache[candleKey] ?? [];
  const chartEmpty = emptyKeys.has(candleKey);
  const chartLoading = candles.length === 0 && !chartEmpty;

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

  // MCap view scales every candle by circulating supply (mc = price × supply).
  const scale =
    denom === "mcap" && display.price > 0
      ? display.supply && display.supply > 0
        ? display.supply
        : display.marketCap / display.price
      : 1;

  const last = candles[candles.length - 1];
  const fmt = (v?: number) =>
    v == null ? "—" : denom === "mcap" ? `$${compact(v * scale)}` : formatPrice(v);

  return (
    <div className="pb-24 lg:pb-0">
      <FadeIn>
        <Link
          href="/"
          className="caps mb-4 inline-flex items-center gap-1.5 text-text-2 transition-colors hover:text-text-1"
        >
          <ArrowLeft size={13} /> Markets
        </Link>
      </FadeIn>

      <div className="flex gap-5">
        {/* Left rail — persistent token list (desktop only) */}
        <aside className="hidden w-[240px] shrink-0 xl:block">
          <div className="sticky top-6 h-[calc(100vh-120px)]">
            <TradeRail activeAddress={address} />
          </div>
        </aside>

        {/* Center column — header, chart, tabs */}
        <div className="min-w-0 flex-1 space-y-5">
          <FadeIn delay={0.05}>
            <div className="glass p-5 sm:p-6">
              {/* Header: identity + key stats */}
              <div className="flex flex-wrap items-start justify-between gap-4">
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
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-[12px] text-text-2">
                        {display.symbol} · {truncateAddress(display.address)}
                      </p>
                      {security && <SecurityBadge sec={security} />}
                    </div>
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

              {/* Stat strip */}
              <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-md)] border border-border sm:grid-cols-4">
                {[
                  { label: "Market cap", value: `$${compact(display.marketCap)}` },
                  { label: "24h Vol", value: `$${compact(display.volume24h)}` },
                  { label: "Liquidity", value: `$${compact(display.liquidity ?? 0)}` },
                  {
                    label: "Holders",
                    value: display.holders != null ? compact(display.holders) : "—",
                  },
                ].map((s) => (
                  <div key={s.label} className="bg-bg-0/40 px-3 py-2.5">
                    <p className="caps">{s.label}</p>
                    <p className="mt-1 font-mono text-[14px] font-medium">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Chart controls: OHLC readout + Price/MCap + range */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  {(["O", "H", "L", "C"] as const).map((k, idx) => {
                    const v = last
                      ? [last.open, last.high, last.low, last.close][idx]
                      : undefined;
                    return (
                      <span key={k} className="text-text-3">
                        {k}{" "}
                        <span className="text-text-1">{fmt(v)}</span>
                      </span>
                    );
                  })}
                </div>
                <div className="flex items-center gap-1 rounded-[var(--radius-pill)] border border-border bg-bg-0/50 p-1">
                  {(["price", "mcap"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDenom(d)}
                      className={`rounded-[var(--radius-pill)] px-3 py-1 font-mono text-[12px] uppercase transition-colors ${
                        denom === d ? "bg-bg-2 text-text-1" : "text-text-2 hover:text-text-1"
                      }`}
                    >
                      {d === "price" ? "Price" : "MCap"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1 rounded-[var(--radius-pill)] border border-border bg-bg-0/50 p-1">
                {RANGES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`rounded-[var(--radius-pill)] px-3 py-1 font-mono text-[12px] transition-colors ${
                      range === r ? "bg-bg-2 text-text-1" : "text-text-2 hover:text-text-1"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <SectionBoundary label="chart">
                  {candles.length ? (
                    <TradingChart candles={candles} scale={scale} />
                  ) : chartLoading ? (
                    <div className="flex h-[360px] items-center justify-center gap-2 text-[13px] text-text-3">
                      <Loader2 size={15} className="animate-spin" /> Loading chart…
                    </div>
                  ) : (
                    <div className="flex h-[360px] items-center justify-center text-[13px] text-text-3">
                      No chart data for this token
                    </div>
                  )}
                </SectionBoundary>
              </div>
            </div>
          </FadeIn>

          {/* Bottom tabs: Swaps / Holders */}
          <FadeIn delay={0.1}>
            <div>
              <div className="mb-3 flex items-center gap-1 rounded-[var(--radius-pill)] border border-border bg-bg-1 p-1">
                {(["swaps", "holders"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`rounded-[var(--radius-pill)] px-4 py-1.5 text-[13px] font-medium capitalize transition-colors ${
                      tab === t ? "bg-bg-2 text-text-1" : "text-text-2 hover:text-text-1"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <SectionBoundary label={tab}>
                {tab === "swaps" ? (
                  <LiveTrades address={display.address} />
                ) : (
                  <HoldersList address={display.address} supply={display.supply} />
                )}
              </SectionBoundary>
            </div>
          </FadeIn>
        </div>

        {/* Right column — trade panel + analytics (sticky, desktop) */}
        <aside className="hidden w-[330px] shrink-0 lg:block">
          <div className="sticky top-6 space-y-4">
            <SectionBoundary label="trade panel">
              <TradePanel token={display} />
            </SectionBoundary>
            <SectionBoundary label="about">
              <TokenStats token={display} />
            </SectionBoundary>
          </div>
        </aside>
      </div>

      {/* Mobile: stats analytics below + floating Trade button + drawer */}
      <div className="mt-5 lg:hidden">
        <TokenStats token={display} />
      </div>

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
