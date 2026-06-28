"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2, Copy, Check, ExternalLink, AlertTriangle, Search, Star } from "lucide-react";
import TokenLogo from "@/components/ui/TokenLogo";
import PriceBadge from "@/components/ui/PriceBadge";
import Skeleton from "@/components/ui/Skeleton";
import SectionBoundary from "@/components/SectionBoundary";
import TradePanel from "@/components/trade/TradePanel";
import TokenStats from "@/components/trade/TokenStats";
import { LiveTrades, HoldersList } from "@/components/trade/LiveFeed";
import { getTokenOverview, getCandles, getTokenSecurity, getOHLCVRange, ohlcvInterval, type Candle } from "@/lib/birdeye";
import { isWatchlisted, toggleWatchlist } from "@/lib/watchlist";
import { MOCK_TOKENS, mockChartSeries } from "@/lib/mock";
import { formatPrice, compact, truncateAddress } from "@/lib/format";
import type { Token, TokenSecurity } from "@/lib/types";

const TradingChart = dynamic(() => import("@/components/TradingChart"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

const RANGES = ["1D", "1W", "1M", "3M", "1Y"] as const;
type Range = (typeof RANGES)[number];
type Tab = "swaps" | "holders" | "thesis";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const RANGE_SPANS: Record<string, number> = {
  "1D": 86400,
  "1W": 7 * 86400,
  "1M": 30 * 86400,
  "3M": 90 * 86400,
  "1Y": 365 * 86400,
};

function riskLevel(sec: TokenSecurity): "safe" | "caution" | "risky" {
  if (sec.mintAuthority) return "risky";
  if (sec.freezeAuthority || sec.top10HolderPercent > 50) return "risky";
  if (sec.top10HolderPercent > 25) return "caution";
  return "safe";
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
  const [addrCopied, setAddrCopied] = useState(false);
  const [starred, setStarred] = useState(() =>
    typeof window !== "undefined" ? isWatchlisted(address) : false
  );
  const [mySwapsOnly, setMySwapsOnly] = useState(false);
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [tabsHeight, setTabsHeight] = useState(220);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef          = useRef<{ startY: number; startH: number } | null>(null);
  const loadingEarlierRef = useRef(false);

  const startResize = useCallback((clientY: number) => {
    dragRef.current = { startY: clientY, startH: tabsHeight };
    setIsDragging(true);

    const onMove = (y: number) => {
      if (!dragRef.current) return;
      const delta = dragRef.current.startY - y; // drag up = more chart = smaller tabs
      setTabsHeight(Math.max(130, Math.min(520, dragRef.current.startH + delta)));
    };
    const onMouseMove = (e: MouseEvent) => onMove(e.clientY);
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); onMove(e.touches[0].clientY); };
    const onEnd = () => {
      dragRef.current = null;
      setIsDragging(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onEnd);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onEnd);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onEnd);
  }, [tabsHeight]);

  const handleLoadEarlier = useCallback(async (beforeTime: number) => {
    if (loadingEarlierRef.current) return;
    loadingEarlierRef.current = true;
    const span     = RANGE_SPANS[range] ?? RANGE_SPANS["1W"];
    const interval = ohlcvInterval(range);
    const earlier  = await getOHLCVRange(address, interval, beforeTime - span, beforeTime - 1);
    if (earlier.length) {
      const key = `${address}-${range}`;
      setCandleCache((prev) => {
        const existing     = prev[key] ?? [];
        const existingTimes = new Set(existing.map((c) => c.time));
        const fresh        = earlier.filter((c) => !existingTimes.has(c.time));
        if (!fresh.length) return prev;
        const merged = [...fresh, ...existing].sort((a, b) => a.time - b.time);
        return { ...prev, [key]: merged };
      });
    }
    loadingEarlierRef.current = false;
  }, [address, range]);

  useEffect(() => {
    localStorage.setItem("chadwallet:last-trade", `/trade/${address}`);
  }, [address]);

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
    return () => { active = false; clearInterval(id); };
  }, [address]);

  useEffect(() => {
    let active = true;
    async function run() {
      await sleep(300);
      if (!active) return;
      const s = await getTokenSecurity(address);
      if (active) setSecurity(s);
    }
    run();
    return () => { active = false; };
  }, [address]);

  const [candleCache, setCandleCache] = useState<Record<string, Candle[]>>({});
  const [emptyKeys, setEmptyKeys] = useState<Set<string>>(new Set());
  const candleKey = `${address}-${range}`;

  useEffect(() => {
    if (candleCache[candleKey]) return;
    let active = true;
    let attempts = 0;
    const key = candleKey;
    async function run() {
      await sleep(150);
      if (!active) return;
      const tryFetch = () => {
        getCandles(address, range).then((c) => {
          if (!active) return;
          if (c.length) {
            setCandleCache((m) => ({ ...m, [key]: c }));
            setEmptyKeys((s) => { if (!s.has(key)) return s; const n = new Set(s); n.delete(key); return n; });
          } else if (attempts < 3) {
            attempts += 1;
            setTimeout(tryFetch, 1500);
          } else {
            setEmptyKeys((s) => new Set(s).add(key));
          }
        });
      };
      tryFetch();
    }
    run();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, range]);

  const candles = candleCache[candleKey] ?? [];
  const chartEmpty = emptyKeys.has(candleKey);
  const chartLoading = candles.length === 0 && !chartEmpty;

  const display: Token = token ?? {
    address,
    name: "Unknown Token",
    symbol: address.slice(0, 4).toUpperCase(),
    price: 0,
    priceChange24h: 0,
    volume24h: 0,
    marketCap: 0,
  };

  const scale =
    denom === "mcap" && display.price > 0
      ? display.supply && display.supply > 0
        ? display.supply
        : display.marketCap / display.price
      : 1;

  const riskBadge = (() => {
    if (!security) return null;
    const level = riskLevel(security);
    const cfg = {
      safe:    { label: "Safe",    color: "var(--success)", bg: "rgba(20,241,149,0.1)" },
      caution: { label: "Caution", color: "#F59E0B",        bg: "rgba(245,158,11,0.1)" },
      risky:   { label: "Risky",   color: "var(--danger)",  bg: "rgba(255,75,75,0.1)" },
    }[level];
    return (
      <span
        className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-bold"
        style={{ color: cfg.color, background: cfg.bg }}
      >
        {level === "risky" && <AlertTriangle size={9} />}
        {cfg.label}
      </span>
    );
  })();

  const copyAddr = () => {
    navigator.clipboard.writeText(address);
    setAddrCopied(true);
    setTimeout(() => setAddrCopied(false), 1500);
  };

  const TOKEN_STATS = [
    { label: "Price",        value: loading ? "—" : formatPrice(display.price) },
    { label: "24H change",   value: null, change: display.priceChange24h },
    { label: "24H Vol.",     value: `$${compact(display.volume24h)}` },
    { label: "Liquidity",    value: `$${compact(display.liquidity ?? 0)}` },
    { label: "Holders",      value: display.holders != null ? compact(display.holders) : "—" },
    {
      label: security ? "Top 10 holding" : "Market cap",
      value: security
        ? `${security.top10HolderPercent.toFixed(2)}%`
        : `$${compact(display.marketCap)}`,
    },
  ];

  return (
    <div className="flex flex-col gap-3 md:h-full md:min-h-0 md:flex-row">

      {/* ── CENTER COLUMN ── */}
      <div className="flex flex-col min-w-0 overflow-hidden rounded-xl border border-bg-tertiary md:min-h-0 md:flex-1">

        {/* Token header bar */}
        <div className="flex shrink-0 items-center gap-0 border-b border-bg-tertiary bg-bg-secondary px-4 py-2.5 overflow-hidden">

          {/* Identity — fixed width, shrink-0 */}
          <div className="flex shrink-0 items-center gap-2.5">
            <TokenLogo src={display.logoURI} symbol={display.symbol} size={34} />
            <div>
              <div className="flex items-center gap-1.5">
                {loading ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  <span className="text-[13px] font-semibold text-text-primary whitespace-nowrap">
                    {display.name}
                  </span>
                )}
                {riskBadge}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <button
                  onClick={copyAddr}
                  className="flex items-center gap-1 font-mono text-[11px] text-text-secondary transition-colors hover:text-text-primary whitespace-nowrap"
                >
                  {display.symbol} · {truncateAddress(address, 4, 4)}
                  {addrCopied ? <Check size={10} className="text-green" /> : <Copy size={10} />}
                </button>
                <a
                  href={`https://solscan.io/token/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-tertiary transition-colors hover:text-text-secondary"
                >
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>

          {/* Action icons */}
          <div className="ml-3 flex shrink-0 items-center gap-1">
            <button
              onClick={() => window.dispatchEvent(new Event("open-search"))}
              className="flex h-6 w-6 items-center justify-center rounded text-text-tertiary transition-colors hover:text-text-primary"
            >
              <Search size={12} />
            </button>
            <button
              onClick={() => {
                if (token) {
                  const next = toggleWatchlist(token);
                  setStarred(next);
                }
              }}
              className="flex h-6 w-6 items-center justify-center rounded transition-colors"
              style={{ color: starred ? "#FFB800" : "var(--text-tertiary)" }}
            >
              <Star size={12} fill={starred ? "#FFB800" : "none"} />
            </button>
          </div>

          {/* Separator */}
          <div className="mx-4 h-8 w-px shrink-0 bg-bg-tertiary" />

          {/* Stats — first 3 always visible, last 3 only at lg+ */}
          <div className="flex flex-1 items-center justify-between min-w-0">
            {TOKEN_STATS.map((s, i) => (
              <div key={s.label} className={`flex-col gap-0.5 ${i < 3 ? "flex" : "hidden lg:flex"}`}>
                <p className="text-[10px] font-medium text-text-secondary leading-none whitespace-nowrap">
                  {s.label}
                </p>
                <div className="flex h-[18px] items-center">
                  {s.change != null ? (
                    <PriceBadge value={s.change} showArrow />
                  ) : (
                    <p className="font-mono text-[13px] font-semibold text-text-primary leading-none whitespace-nowrap">
                      {s.value}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart area */}
        <div className="flex flex-col md:min-h-0 md:flex-1">
          {/* Single unified controls bar — scrollable so it never clips on narrow viewports */}
          <div className="no-scrollbar flex shrink-0 items-center gap-2 overflow-x-auto border-b border-bg-tertiary px-3 py-1.5">
            {/* Range picker */}
            <div className="flex shrink-0 items-center gap-0.5">
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded px-2 py-0.5 font-mono text-[11px] font-medium transition-colors ${
                    range === r
                      ? "bg-bg-tertiary text-text-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="h-4 w-px shrink-0 bg-bg-tertiary" />

            {/* Price / MCap */}
            <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-bg-tertiary bg-bg-primary p-0.5">
              {(["price", "mcap"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDenom(d)}
                  className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] transition-colors ${
                    denom === d
                      ? "bg-bg-tertiary text-text-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {d === "price" ? "Price" : "MCap"}
                </button>
              ))}
            </div>

            <div className="h-4 w-px shrink-0 bg-bg-tertiary" />

            {/* My swaps / Friends only */}
            {([
              ["mySwaps", "My swaps", mySwapsOnly, setMySwapsOnly],
              ["friendsOnly", "Friends only", friendsOnly, setFriendsOnly],
            ] as [string, string, boolean, (v: boolean) => void][]).map(([id, label, checked, setter]) => (
              <label key={id} className="flex shrink-0 cursor-pointer select-none items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setter(e.target.checked)}
                  className="h-3 w-3 cursor-pointer accent-[var(--accent-primary)]"
                />
                <span className="text-[11px] text-text-secondary">{label}</span>
              </label>
            ))}
          </div>

          {/* Mobile: square. md: capped (mobile-in-desktop-mode has 2000px+ virtual height). lg+: fill. */}
          <div className="aspect-square w-full shrink-0 md:aspect-auto md:min-h-0 md:flex-1 md:max-h-[500px] lg:max-h-none">
            <SectionBoundary label="chart">
              {candles.length ? (
                <TradingChart candles={candles} scale={scale} height="fill" onLoadEarlier={handleLoadEarlier} />
              ) : chartLoading ? (
                <div className="flex h-full items-center justify-center gap-2 text-[13px] text-text-secondary">
                  <Loader2 size={15} className="animate-spin" /> Loading chart…
                </div>
              ) : (() => {
                const seed = address.charCodeAt(0);
                const priceMult = display.price > 0 ? display.price / 100 : 1;
                const series = mockChartSeries(90, seed);
                const mockCandles: Candle[] = series.map((p, i, arr) => {
                  const prev = i > 0 ? arr[i - 1].value : p.value;
                  const open = prev * priceMult;
                  const close = p.value * priceMult;
                  return {
                    time: p.time,
                    open,
                    high: Math.max(open, close),
                    low: Math.min(open, close),
                    close,
                    volume: 0,
                  };
                });
                return (
                  <div className="relative h-full w-full">
                    <div className="opacity-40 h-full w-full">
                      <TradingChart candles={mockCandles} scale={scale} height="fill" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="rounded-md border border-bg-tertiary bg-bg-secondary px-3 py-1.5 text-[12px] font-medium text-text-secondary">
                        Preview — live data unavailable
                      </span>
                    </div>
                  </div>
                );
              })()}
            </SectionBoundary>
          </div>
        </div>

        {/* Resize handle — desktop only */}
        <div
          className="group relative hidden h-3 shrink-0 cursor-row-resize items-center justify-center md:flex"
          onMouseDown={(e) => { e.preventDefault(); startResize(e.clientY); }}
          onTouchStart={(e) => startResize(e.touches[0].clientY)}
        >
          <div className={`h-1 w-10 rounded-full transition-colors ${isDragging ? "bg-text-tertiary" : "bg-bg-tertiary group-hover:bg-text-tertiary"}`} />
          <span className="pointer-events-none absolute left-1/2 top-full z-20 -translate-x-1/2 whitespace-nowrap rounded-md border border-bg-tertiary bg-bg-secondary px-2 py-1 text-[11px] text-text-secondary opacity-0 transition-opacity group-hover:opacity-100">
            Resize chart
          </span>
        </div>

        {/* Bottom tabs — fixed-height + inner scroll on desktop; natural height on mobile */}
        <div className="flex flex-col border-t border-bg-tertiary md:shrink-0" style={{ height: tabsHeight }}>
          <div className="flex shrink-0 items-center gap-4 border-b border-bg-tertiary px-4 py-2">
            {(["swaps", "holders", "thesis"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{ fontWeight: tab === t ? 700 : 500 }}
                className={`text-[13px] capitalize transition-colors ${
                  tab === t
                    ? "text-text-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {t === "thesis" ? "Thesis" : t}
              </button>
            ))}
            {/* Friends only toggle in tab bar */}
            {tab === "thesis" && (
              <label className="ml-auto flex cursor-pointer items-center gap-1.5 select-none">
                <input
                  type="checkbox"
                  checked={friendsOnly}
                  onChange={(e) => setFriendsOnly(e.target.checked)}
                  className="h-3 w-3 cursor-pointer accent-[var(--accent-primary)]"
                />
                <span className="text-[11px] text-text-secondary">Friends only</span>
              </label>
            )}
          </div>
          <div className="no-scrollbar flex-1 overflow-y-auto">
            <SectionBoundary label={tab}>
              {tab === "swaps" ? (
                <LiveTrades address={display.address} />
              ) : tab === "holders" ? (
                <HoldersList address={display.address} supply={display.supply} holderCount={display.holders} />
              ) : (
                <div className="flex h-full items-center justify-center py-12 text-[13px] text-text-secondary">
                  No thesis posts yet
                </div>
              )}
            </SectionBoundary>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — visible at md+ (768px), so mobile desktop mode gets it ── */}
      <aside className="hidden w-[268px] shrink-0 flex-col overflow-hidden rounded-xl border border-bg-tertiary bg-bg-secondary md:flex">
        <div className="no-scrollbar flex-1 overflow-y-auto">
          <SectionBoundary label="trade panel">
            <TradePanel token={display} />
          </SectionBoundary>
          <div className="border-t border-bg-tertiary">
            <SectionBoundary label="token stats">
              <TokenStats token={display} />
            </SectionBoundary>
          </div>
          {/* Your positions */}
          <div className="border-t border-bg-tertiary px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12px] font-semibold text-text-primary">
                Your positions
              </span>
              <div className="flex items-center rounded-lg p-0.5" style={{ background: "var(--bg-tertiary-solid)" }}>
                <span className="rounded-md px-2.5 py-1 text-[11px] font-semibold text-text-primary" style={{ background: "var(--bg-primary)" }}>
                  Open
                </span>
                <span className="px-2.5 py-1 text-[11px] font-medium text-text-tertiary">
                  Closed
                </span>
              </div>
            </div>
            <p className="py-5 text-center text-[12px] text-text-tertiary">
              No open positions
            </p>
          </div>
        </div>
      </aside>

      {/* ── Very-narrow fallback: floating Trade button (only below md where right panel is hidden) ── */}
      <div className="fixed inset-x-0 bottom-4 z-30 px-4 md:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          className="btn-buy flex h-[52px] w-full items-center justify-center rounded-[var(--radius-md)] text-[15px] font-bold text-white shadow-lg"
        >
          Trade {display.symbol}
        </button>
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
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
