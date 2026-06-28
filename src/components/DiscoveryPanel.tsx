"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import TokenLogo from "./ui/TokenLogo";
import PriceBadge from "./ui/PriceBadge";
import { formatPrice, compact } from "@/lib/format";
import { getTrendingTokens, getGainers, getLosers, getNewListings, getCryptoTokens } from "@/lib/birdeye";
import { getWatchlist } from "@/lib/watchlist";
import { useSolanaWallet } from "@/lib/solana";
import { avatarGradient, monogram, handleFromAddress } from "@/lib/handle";
import type { Token } from "@/lib/types";

/* ─── constants ──────────────────────────────────────────────────── */
const TABS = ["Alerts", "Tokens", "Leaderboard", "Feed"] as const;
type Tab = (typeof TABS)[number];

const TIME_FILTERS = ["24H", "7D", "30D", "ALL"] as const;
type TimeFilter = (typeof TIME_FILTERS)[number];

/* ─── mock leaderboard ───────────────────────────────────────────── */
const MOCK_TRADERS = [
  { rank: 1,  name: "asta",             handle: "astaso1",             pnl: 150231.11 },
  { rank: 2,  name: "A.L. Trenchman",   handle: "Captain_AL_80",       pnl:  74484.74 },
  { rank: 3,  name: "Pingu Charts",     handle: "pingucharts",          pnl:  57128.46 },
  { rank: 4,  name: "Dedrater",         handle: "0xdedrater",           pnl:  36960.85 },
  { rank: 5,  name: "Ayovex🦕",         handle: "VexRex23",             pnl:  28455.66 },
  { rank: 6,  name: "X Ventures",       handle: "XVentures",            pnl:  26716.56 },
  { rank: 7,  name: "Colby",            handle: "Colby",                pnl:  23521.03 },
  { rank: 8,  name: "ipsoFomo",         handle: "WaterySimpleBobolink", pnl:  23271.65 },
  { rank: 9,  name: "CGJ",              handle: "CryptoGodJohn",        pnl:  22738.10 },
  { rank: 10, name: "0xBossman",        handle: "0xBossman",            pnl:  19425.72 },
  { rank: 11, name: "wrld",             handle: "wrld_sol",             pnl:  18468.42 },
  { rank: 12, name: "DTM (punch/acc)",  handle: "ddtpmb",               pnl:  18238.83 },
  { rank: 13, name: "majority holder",  handle: "majorityholder",       pnl:  15528.35 },
];

/* ─── Medal SVGs matching fomo's sprite names ────────────────────── */
function Medal({ rank }: { rank: number }) {
  const colors: Record<number, [string, string]> = {
    1: ["#FFD700", "#B8860B"],
    2: ["#C0C0C0", "#808080"],
    3: ["#CD7F32", "#8B4513"],
  };
  const pair = colors[rank];
  if (!pair) {
    return <div className="w-5 shrink-0 text-center text-xs text-text-secondary">{rank}.</div>;
  }
  const [fill, stroke] = pair;
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="15" r="7" fill={fill} />
      <path d="M9 8.5L12 2l3 6.5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="15" r="7" stroke={stroke} strokeWidth="0.5" fill="none" />
      <text x="12" y="19.5" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#000" opacity="0.7">{rank}</text>
    </svg>
  );
}

/* ─── Token thumbnail stack (matches fomo: 18px circles, -5.6px overlap) ── */
const TOKEN_COLORS = ["#9945FF", "#14F195", "#FF4B4B", "#FFB800", "#00C2FF", "#FF69B4", "#7CFC00"];

function TokenThumbs({ count, seed }: { count: number; seed: string }) {
  const show = Math.min(count, 3);
  const overflow = count - 3;
  return (
    <div className="flex flex-row items-center">
      {Array.from({ length: show }).map((_, i) => {
        const color = TOKEN_COLORS[(seed.charCodeAt(i % seed.length) + i) % TOKEN_COLORS.length];
        return (
          <div
            key={i}
            className="shrink-0 overflow-hidden rounded-full border-2 border-bg-primary bg-bg-secondary"
            style={{ width: 18, height: 18, marginLeft: i === 0 ? 0 : -5.6, background: color }}
          />
        );
      })}
      {overflow > 0 && (
        <div
          className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-bg-primary bg-bg-secondary font-medium text-text-secondary"
          style={{ width: 23, height: 23, marginLeft: -8, fontSize: 8 }}
        >
          {overflow}+
        </div>
      )}
    </div>
  );
}

/* ─── Tab content ────────────────────────────────────────────────── */

function AlertsTab() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <p className="text-[13px] font-medium text-text-primary">No alerts set</p>
      <p className="text-[11px] text-text-secondary">Set price alerts to get notified on big moves.</p>
    </div>
  );
}

const TOKEN_SUB_FILTERS = [
  { key: "trending",  label: "Trending"  },
  { key: "watchlist", label: "Watchlist" },
  { key: "new",       label: "New"       },
  { key: "gainers",   label: "Gainers"   },
  { key: "losers",    label: "Losers"    },
  { key: "crypto",    label: "Crypto"    },
] as const;
type TokenSubFilter = (typeof TOKEN_SUB_FILTERS)[number]["key"];

function TokensTab({ activeAddress }: { activeAddress?: string }) {
  const [trending, setTrending] = useState<Token[]>([]);
  const [subFilter, setSubFilter] = useState<TokenSubFilter>("trending");
  const [filterData, setFilterData] = useState<Partial<Record<TokenSubFilter, Token[]>>>({});
  const [filterLoading, setFilterLoading] = useState(false);
  const [watchlist, setWatchlist] = useState<Token[]>([]);
  const loadedFilters = useRef<Set<string>>(new Set());

  // Trending: poll every 30s
  useEffect(() => {
    let mounted = true;
    const load = () => getTrendingTokens().then((t) => { if (mounted) setTrending(t); });
    load();
    const id = setInterval(load, 30000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  // Watchlist: sync from localStorage
  useEffect(() => {
    const sync = () => setWatchlist(getWatchlist());
    sync();
    window.addEventListener("watchlist-change", sync);
    return () => window.removeEventListener("watchlist-change", sync);
  }, []);

  // Per-subfilter lazy load (gainers, losers, new, crypto)
  useEffect(() => {
    if (subFilter === "trending" || subFilter === "watchlist") return;
    if (loadedFilters.current.has(subFilter)) return;
    loadedFilters.current.add(subFilter);
    let mounted = true;
    setFilterLoading(true);
    const loaders: Partial<Record<TokenSubFilter, () => Promise<Token[]>>> = {
      gainers: getGainers,
      losers:  getLosers,
      new:     getNewListings,
      crypto:  getCryptoTokens,
    };
    loaders[subFilter]?.().then((t) => {
      if (mounted) {
        setFilterData((prev) => ({ ...prev, [subFilter]: t }));
        setFilterLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [subFilter]);

  const displayedTokens: Token[] = (() => {
    if (subFilter === "watchlist") return watchlist;
    if (subFilter === "trending")  return trending;
    return filterData[subFilter] ?? [];
  })();

  const isLoading = (() => {
    if (subFilter === "watchlist") return false;
    if (subFilter === "trending")  return trending.length === 0;
    return filterLoading && filterData[subFilter] === undefined;
  })();

  const subFilterPills = (
    <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto px-3 pb-1 pt-2">
      {TOKEN_SUB_FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => setSubFilter(f.key)}
          className="flex-none whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors"
          style={
            subFilter === f.key
              ? { background: "var(--accent-primary)", color: "#fff" }
              : { background: "var(--bg-tertiary-solid)", color: "var(--text-secondary)" }
          }
        >
          {f.label}
        </button>
      ))}
    </div>
  );

  // Watchlist empty state
  if (subFilter === "watchlist" && watchlist.length === 0) {
    return (
      <>
        {subFilterPills}
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
          <p className="text-[13px] font-medium text-text-primary">None</p>
          <p className="text-[11px] text-text-secondary">Star a token on its page to add it here.</p>
        </div>
      </>
    );
  }

  return (
    <>
      {subFilterPills}

      {/* Token list — pb-16 on mobile leaves room above the BottomNav */}
      <div className="no-scrollbar flex flex-1 flex-col gap-px overflow-y-scroll overflow-x-hidden px-2 pb-16 lg:pb-0">
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 rounded-lg px-2 py-2">
                <div className="h-3 w-4 shrink-0 animate-pulse rounded bg-bg-tertiary" />
                <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-bg-tertiary" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="h-2.5 w-16 animate-pulse rounded bg-bg-tertiary" />
                  <div className="h-2 w-12 animate-pulse rounded bg-bg-tertiary" />
                </div>
              </div>
            ))
          : displayedTokens.map((t, i) => (
              <Link
                key={t.address}
                href={`/trade/${t.address}`}
                className={`flex items-center gap-2.5 rounded-lg px-2 py-1 min-w-0 transition-colors hover:bg-bg-secondary focus-visible:bg-bg-secondary ${
                  t.address === activeAddress ? "bg-bg-secondary" : ""
                }`}
              >
                <span className="w-5 shrink-0 text-center text-xs text-text-secondary">{i + 1}.</span>
                <TokenLogo src={t.logoURI} symbol={t.symbol} size={36} />
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-0.5">
                  <p className="truncate text-sm text-text-primary">{t.symbol}</p>
                  <p className="truncate text-xs text-text-secondary">${compact(t.marketCap)} MC</p>
                </div>
                <div className="flex h-12 shrink-0 flex-col items-end justify-center gap-1">
                  <p className="font-mono text-[12px] text-text-primary">{formatPrice(t.price)}</p>
                  <PriceBadge value={t.priceChange24h} showArrow={false} />
                </div>
              </Link>
            ))
        }
      </div>
    </>
  );
}

function LeaderboardTab({ timeFilter }: { timeFilter: TimeFilter }) {
  const { address } = useSolanaWallet();
  const handle = handleFromAddress(address);
  void timeFilter;

  return (
    <>
      {/* Your rank — pinned above the scroll area, dashed border below */}
      <div className="mx-3 flex shrink-0 items-center gap-2 border-b border-dashed border-bg-tertiary py-2">
        <div
          className="flex shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
          style={{ height: 36, width: 36, background: avatarGradient(address) }}
        >
          {monogram(handle)}
        </div>
        <div className="flex flex-1 flex-col items-start">
          <div className="text-xs text-text-secondary">Your rank</div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-accent-primary">#</span>
            <span className="font-bold text-text-primary">-</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-xs text-text-secondary">PnL</div>
          <div className="flex items-center gap-0.5" style={{ lineHeight: "20px" }}>
            <span style={{ fontSize: 16, fontWeight: 500, color: "rgb(152,153,163)" }}>--</span>
          </div>
        </div>
      </div>

      {/* Trader list — matches fomo: flex-1 overflow-y-scroll overflow-x-hidden px-2 */}
      <div className="no-scrollbar flex flex-1 flex-col gap-px overflow-y-scroll overflow-x-hidden px-2">
        {MOCK_TRADERS.map((t) => {
          const pnlStr = t.pnl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          const thumbCount = t.rank <= 3 ? 4 : t.rank <= 6 ? 3 : 2;
          return (
            <div
              key={t.handle}
              className="flex min-w-0 cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1 hover:bg-bg-secondary"
            >
              <Medal rank={t.rank} />
              <div
                className="flex shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                style={{ width: 36, height: 36, background: avatarGradient(t.handle) }}
              >
                {monogram(t.name)}
              </div>
              <div className="flex min-w-0 shrink flex-1 flex-col justify-between gap-0.5">
                <div className="truncate text-sm text-text-primary">{t.name}</div>
                <div className="truncate text-xs text-text-secondary">@{t.handle}</div>
              </div>
              <div className="flex h-12 shrink-0 flex-col items-end justify-center gap-1">
                <div className="flex items-center gap-0.5" style={{ lineHeight: "20px" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "rgb(33,201,94)" }}>+</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "rgb(33,201,94)" }}>${pnlStr}</span>
                </div>
                <TokenThumbs count={thumbCount} seed={t.handle} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function FeedTab() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <p className="text-[13px] font-medium text-text-primary">Feed coming soon</p>
      <p className="text-[11px] text-text-secondary">Follow traders to see their activity here.</p>
    </div>
  );
}

/* ─── Collapse SVG (exact from fomo HTML) ───────────────────────── */
const CollapseSVG = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3 w-3">
    <path
      d="M7.25609 11.911C7.58193 12.2369 7.58193 12.7636 7.25609 13.0894C7.09359 13.2519 6.88023 13.3336 6.6669 13.3336C6.45357 13.3336 6.24021 13.2519 6.07771 13.0894L0.244375 7.25609C-0.0814583 6.93026 -0.0814583 6.40354 0.244375 6.07771L6.07771 0.244375C6.40354 -0.0814583 6.93026 -0.0814583 7.25609 0.244375C7.58193 0.570208 7.58193 1.09693 7.25609 1.42276L2.01195 6.6669L7.25609 11.911ZM7.84529 6.6669L13.0894 1.42276C13.4153 1.09693 13.4153 0.570208 13.0894 0.244375C12.7636 -0.0814583 12.2369 -0.0814583 11.911 0.244375L6.07771 6.07771C5.75187 6.40354 5.75187 6.93026 6.07771 7.25609L11.911 13.0894C12.0735 13.2519 12.2869 13.3336 12.5002 13.3336C12.7136 13.3336 12.9269 13.2519 13.0894 13.0894C13.4153 12.7636 13.4153 12.2369 13.0894 11.911L7.84529 6.6669Z"
      fill="currentColor"
    />
  </svg>
);

/* ─── Main component ─────────────────────────────────────────────── */
export default function DiscoveryPanel({ onCollapse }: { onCollapse?: () => void }) {
  const pathname = usePathname();
  const [tab, setTab] = useState<Tab>("Tokens");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("24H");

  const activeAddress = pathname.startsWith("/trade/")
    ? pathname.split("/trade/")[1]
    : undefined;

  return (
    /* Matches fomo: flex flex-1 flex-col rounded-xl border border-bg-tertiary min-h-0 min-w-0 pb-2 */
    <div className="flex flex-1 flex-col rounded-xl border border-bg-tertiary min-h-0 min-w-0 pb-2">

      {/* Tab header — matches fomo: p-2 pl-3 rounded-t-xl bg-bg-secondary flex items-center shrink-0 */}
      <div className="flex shrink-0 items-center rounded-t-xl bg-bg-secondary p-2 pl-3">
        {/* Horizontally scrollable tabs — cursor-grab, overflow-x-auto */}
        <div className="relative min-w-0 flex-1">
          <div className="no-scrollbar flex cursor-grab items-center gap-2 overflow-x-auto overflow-y-hidden text-sm font-medium">
            {TABS.map((t, i) => (
              <div key={t} className="flex items-center gap-2">
                {i > 0 && <div className="h-4 w-px shrink-0 bg-bg-tertiary/40" aria-hidden="true" />}
                <button
                  onClick={() => setTab(t)}
                  className={`flex-none items-center justify-start gap-1 whitespace-nowrap text-left transition-colors ${
                    tab === t ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
                  } ${t === "Alerts" ? "flex" : ""}`}
                >
                  {t === "Alerts" && (
                    <span className="relative flex shrink-0 items-center justify-center">
                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2zm6-6V11a6 6 0 0 0-5-5.91V4a1 1 0 0 0-2 0v1.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2z"/>
                      </svg>
                    </span>
                  )}
                  <span>{t}</span>
                </button>
              </div>
            ))}
          </div>
          {/* Fade-out gradient on right edge */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-bg-secondary to-transparent" />
        </div>
        {/* Collapse button — desktop only */}
        <div className="ml-auto hidden shrink-0 items-center gap-1 lg:flex">
          <button
            onClick={() => onCollapse?.()}
            className="p-1 text-text-tertiary transition-colors hover:text-text-primary focus:outline-none"
            aria-label="Collapse discovery panel"
          >
            <CollapseSVG />
          </button>
        </div>
      </div>

      {/* Time filter — shown for Leaderboard */}
      {tab === "Leaderboard" && (
        <div className="flex items-center gap-2 px-3 pb-1 pt-2">
          {TIME_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              className={`inline-flex h-6 w-8 items-center justify-center rounded-md border border-bg-tertiary-solid text-xs font-bold leading-none transition-colors hover:bg-bg-tertiary hover:text-text-primary focus:bg-bg-tertiary ${
                timeFilter === f
                  ? "bg-bg-tertiary text-text-primary"
                  : "text-text-tertiary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Content area — flex column, individual tabs own their scroll */}
      <div className="flex flex-col flex-1 min-h-0 gap-2">
        {tab === "Alerts"      && <AlertsTab />}
        {tab === "Tokens"      && <TokensTab activeAddress={activeAddress} />}
        {tab === "Leaderboard" && <LeaderboardTab timeFilter={timeFilter} />}
        {tab === "Feed"        && <FeedTab />}
      </div>
    </div>
  );
}
