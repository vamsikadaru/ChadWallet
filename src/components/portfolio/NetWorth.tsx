"use client";

import { useEffect, useMemo, useState } from "react";
import CountUp from "react-countup";
import PriceBadge from "../ui/PriceBadge";
import NetWorthChart from "./NetWorthChart";
import { makeSparkline } from "@/lib/mock";
import { getPriceHistory } from "@/lib/birdeye";
import { SOL_MINT } from "@/lib/holdings";

const RANGES = ["24H", "1W", "1M", "1Y", "ALL"] as const;
type Range = (typeof RANGES)[number];

/**
 * Net worth card. The chart is driven by real SOL price history from Birdeye
 * (a live market-shaped proxy for portfolio movement), anchored so the final
 * point equals the current net worth. Falls back to a generated curve only if
 * the history request returns nothing.
 */
export default function NetWorth({
  value,
  change24h,
  loading,
}: {
  value: number;
  change24h: number;
  loading?: boolean;
}) {
  const [range, setRange] = useState<Range>("1W");
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    let active = true;
    getPriceHistory(SOL_MINT, range).then((points) => {
      if (active) setHistory(points.map((p) => p.value));
    });
    return () => {
      active = false;
    };
  }, [range]);

  const positive = change24h >= 0;

  // Anchor the real history curve to the current net worth (scale by last pt).
  const series = useMemo(() => {
    if (history.length > 1) {
      const last = history[history.length - 1] || 1;
      const factor = value > 0 ? value / last : 1;
      return history.map((v) => v * factor);
    }
    const seed = { "24H": 11, "1W": 22, "1M": 33, "1Y": 44, ALL: 55 }[range];
    const pts = { "24H": 24, "1W": 28, "1M": 40, "1Y": 52, ALL: 64 }[range];
    return makeSparkline(seed, pts, positive).map((v) => (v / 100) * value);
  }, [history, value, range, positive]);

  const changeUsd = (value * change24h) / 100;

  return (
    <div className="glass p-6 sm:p-7">
      <div className="flex items-start justify-between">
        <div>
          <p className="caps">Net Worth</p>
          <div className="mt-2 flex items-end gap-3">
            <span className="hero-number text-[clamp(40px,7vw,60px)]">
              <CountUp
                end={value}
                duration={1.1}
                separator=","
                decimals={2}
                prefix="$"
                preserveValue
              />
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <PriceBadge value={change24h} size="md" />
            <span className="font-mono text-[13px] text-text-2">
              {positive ? "+" : "-"}$
              {Math.abs(changeUsd).toLocaleString("en-US", {
                maximumFractionDigits: 2,
              })}{" "}
              today
            </span>
          </div>
        </div>

        <div className="hidden items-center gap-1 rounded-[var(--radius-pill)] border border-border bg-bg-0/50 p-1 sm:flex">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-[var(--radius-pill)] px-2.5 py-1 font-mono text-[11px] transition-colors ${
                range === r
                  ? "bg-bg-2 text-text-1"
                  : "text-text-2 hover:text-text-1"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {loading && value === 0 ? (
          <div className="h-[160px] animate-pulse rounded-[var(--radius-md)] bg-bg-2/40" />
        ) : (
          <NetWorthChart series={series} positive={positive} />
        )}
      </div>

      {/* Mobile range row */}
      <div className="mt-3 flex items-center justify-center gap-1 sm:hidden">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded-[var(--radius-pill)] px-3 py-1 font-mono text-[11px] transition-colors ${
              range === r ? "bg-bg-2 text-text-1" : "text-text-2"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}
