"use client";

import { useState } from "react";
import { compact } from "@/lib/format";
import type { Token } from "@/lib/types";

const PERIODS: { key: string; label: string; highlight?: boolean }[] = [
  { key: "5m",  label: "5M"  },
  { key: "1h",  label: "1H", highlight: true },
  { key: "4h",  label: "4H"  },
  { key: "24h", label: "1D"  },
];

function SplitBar({
  left, right, leftLabel, rightLabel,
}: {
  left: number; right: number; leftLabel: string; rightLabel: string;
}) {
  const total = left + right || 1;
  const lp = (left / total) * 100;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[12px]">
        <span className="font-mono font-medium" style={{ color: "var(--success)" }}>{leftLabel}</span>
        <span className="font-mono font-medium" style={{ color: "var(--danger)" }}>{rightLabel}</span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full" style={{ background: "var(--bg-tertiary-solid)" }}>
        <div className="h-full rounded-l-full transition-all" style={{ width: `${lp}%`, background: "var(--success)" }} />
        <div className="h-full rounded-r-full transition-all" style={{ width: `${100 - lp}%`, background: "var(--danger)" }} />
      </div>
    </div>
  );
}

export default function TokenStats({ token }: { token: Token }) {
  const [expanded, setExpanded] = useState(false);

  const perf: Record<string, number | undefined> = {
    "5m":  token.change5m,
    "1h":  token.change1h,
    "4h":  token.change4h,
    "24h": token.priceChange24h,
  };

  const buys     = token.buys24h   ?? 0;
  const sells    = token.sells24h  ?? 0;
  const vBuy     = token.vBuy24h   ?? 0;
  const vSell    = token.vSell24h  ?? 0;
  const buyers   = Math.round(buys  * 0.65);
  const sellers  = Math.round(sells * 0.65);
  const hasFlow  = buys > 0 || sells > 0 || vBuy > 0 || vSell > 0;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* About */}
      <div>
        <p className="text-[13px] font-semibold text-text-primary">About {token.symbol}</p>
        {token.description ? (
          <p className="mt-1.5 text-[12px] leading-relaxed text-text-secondary">
            {expanded || token.description.length <= 120
              ? token.description
              : token.description.slice(0, 120) + "… "}
            {token.description.length > 120 && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="font-semibold text-accent-primary hover:opacity-80"
              >
                {expanded ? " Less" : " Read more"}
              </button>
            )}
          </p>
        ) : (
          <p className="mt-1.5 text-[12px] text-text-secondary">No description available.</p>
        )}
      </div>

      {/* 4-period grid — 1H highlighted */}
      <div className="grid grid-cols-4 gap-1.5">
        {PERIODS.map((p) => {
          const v = perf[p.key];
          const up = (v ?? 0) >= 0;
          const color = v == null ? "var(--text-tertiary)" : up ? "var(--success)" : "var(--danger)";
          return (
            <div
              key={p.key}
              className="flex flex-col items-center rounded-lg border py-2"
              style={
                p.highlight
                  ? { borderColor: "var(--accent-primary)", background: "rgba(var(--accent-primary-rgb),0.06)" }
                  : { borderColor: "var(--bg-tertiary-solid)", background: "var(--bg-secondary)" }
              }
            >
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: p.highlight ? "var(--accent-primary)" : "var(--text-secondary)" }}
              >
                {p.label}
              </span>
              <span className="mt-1 font-mono text-[12px] font-semibold" style={{ color }}>
                {v == null ? "—" : `${up ? "▲" : "▼"}${Math.abs(v).toFixed(1)}%`}
              </span>
            </div>
          );
        })}
      </div>

      {/* 3 SplitBars */}
      {hasFlow && (
        <div className="space-y-3">
          <SplitBar
            left={buys} right={sells}
            leftLabel={`${compact(buys)} buys`}
            rightLabel={`${compact(sells)} sells`}
          />
          <SplitBar
            left={vBuy} right={vSell}
            leftLabel={`$${compact(vBuy)} vol`}
            rightLabel={`$${compact(vSell)} vol`}
          />
          <SplitBar
            left={buyers} right={sellers}
            leftLabel={`${compact(buyers)} buyers`}
            rightLabel={`${compact(sellers)} sellers`}
          />
        </div>
      )}

      {/* View more */}
      <button className="mx-auto flex h-8 items-center rounded-lg border border-bg-tertiary px-4 text-[12px] font-medium text-text-secondary transition-colors hover:border-text-tertiary hover:text-text-primary">
        View more
      </button>
    </div>
  );
}
