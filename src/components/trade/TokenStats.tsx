"use client";

import { useState } from "react";
import { compact } from "@/lib/format";
import type { Token } from "@/lib/types";

/** A two-sided proportional bar (e.g. buys vs sells). */
function SplitBar({
  left,
  right,
  leftLabel,
  rightLabel,
}: {
  left: number;
  right: number;
  leftLabel: string;
  rightLabel: string;
}) {
  const total = left + right || 1;
  const lp = (left / total) * 100;
  return (
    <div>
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-mono text-success">{leftLabel}</span>
        <span className="font-mono text-danger">{rightLabel}</span>
      </div>
      <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-bg-2">
        <div className="h-full bg-success" style={{ width: `${lp}%` }} />
        <div className="h-full bg-danger" style={{ width: `${100 - lp}%` }} />
      </div>
    </div>
  );
}

const PERIODS = [
  { key: "5m", label: "5M" },
  { key: "1h", label: "1H" },
  { key: "4h", label: "4H" },
  { key: "24h", label: "1D" },
] as const;

export default function TokenStats({ token }: { token: Token }) {
  const [expanded, setExpanded] = useState(false);

  const perf: Record<string, number | undefined> = {
    "5m": token.change5m,
    "1h": token.change1h,
    "4h": token.change4h,
    "24h": token.priceChange24h,
  };

  const hasFlow =
    token.buys24h != null ||
    token.sells24h != null ||
    token.vBuy24h != null ||
    token.vSell24h != null;

  return (
    <div className="glass p-5">
      <h3 className="font-display text-[16px] font-bold">About {token.symbol}</h3>

      {token.description && (
        <p className="mt-2 text-[13px] leading-relaxed text-text-2">
          {expanded || token.description.length <= 120
            ? token.description
            : token.description.slice(0, 120) + "… "}
          {token.description.length > 120 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="font-medium text-accent transition-colors hover:opacity-80"
            >
              {expanded ? "Less" : "Read more"}
            </button>
          )}
        </p>
      )}

      {/* Multi-timeframe performance */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {PERIODS.map((p) => {
          const v = perf[p.key];
          const up = (v ?? 0) >= 0;
          return (
            <div
              key={p.key}
              className="rounded-[var(--radius-sm)] border border-border bg-bg-0/40 px-2 py-2 text-center"
            >
              <p className="caps">{p.label}</p>
              <p
                className="mt-1 font-mono text-[12px] font-medium"
                style={{ color: v == null ? "var(--text-3)" : up ? "var(--success)" : "var(--danger)" }}
              >
                {v == null ? "—" : `${up ? "▲" : "▼"} ${Math.abs(v).toFixed(2)}%`}
              </p>
            </div>
          );
        })}
      </div>

      {/* Buys / sells flow */}
      {hasFlow && (
        <div className="mt-5 space-y-4">
          <SplitBar
            left={token.buys24h ?? 0}
            right={token.sells24h ?? 0}
            leftLabel={`${compact(token.buys24h ?? 0)} buys`}
            rightLabel={`${compact(token.sells24h ?? 0)} sells`}
          />
          <SplitBar
            left={token.vBuy24h ?? 0}
            right={token.vSell24h ?? 0}
            leftLabel={`$${compact(token.vBuy24h ?? 0)} vol`}
            rightLabel={`$${compact(token.vSell24h ?? 0)} vol`}
          />
        </div>
      )}

      {/* Quick stats */}
      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4">
        <div>
          <p className="caps">Holders</p>
          <p className="mt-1 font-mono text-[14px]">
            {token.holders != null ? compact(token.holders) : "—"}
          </p>
        </div>
        <div>
          <p className="caps">Liquidity</p>
          <p className="mt-1 font-mono text-[14px]">
            ${compact(token.liquidity ?? 0)}
          </p>
        </div>
        <div>
          <p className="caps">Market cap</p>
          <p className="mt-1 font-mono text-[14px]">
            ${compact(token.marketCap)}
          </p>
        </div>
      </div>
    </div>
  );
}
