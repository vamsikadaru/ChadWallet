"use client";

import { useState } from "react";
import { compact } from "@/lib/format";
import type { Token } from "@/lib/types";

type PeriodKey = "5m" | "1h" | "4h" | "24h";

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "5m",  label: "5M" },
  { key: "1h",  label: "1H" },
  { key: "4h",  label: "4H" },
  { key: "24h", label: "1D" },
];

function SplitBar({
  left, right, leftLabel, rightLabel,
}: {
  left: number; right: number; leftLabel: string; rightLabel: string;
}) {
  const total = left + right || 1;
  const lp = (left / total) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold" style={{ color: "var(--color-green)" }}>{leftLabel}</span>
        <span className="text-[12px] font-semibold" style={{ color: "var(--color-red)" }}>{rightLabel}</span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full" style={{ background: "var(--bg-tertiary-solid)" }}>
        <div className="h-full rounded-l-full transition-all" style={{ width: `${lp}%`, background: "var(--color-green)" }} />
        <div className="h-full rounded-r-full transition-all" style={{ width: `${100 - lp}%`, background: "var(--color-red)" }} />
      </div>
    </div>
  );
}

export default function TokenStats({ token }: { token: Token }) {
  const [expanded, setExpanded] = useState(false);
  const [activePeriod, setActivePeriod] = useState<PeriodKey>("1h");

  const perf: Record<PeriodKey, number | undefined> = {
    "5m":  token.change5m,
    "1h":  token.change1h,
    "4h":  token.change4h,
    "24h": token.priceChange24h,
  };

  const buys    = token.buys24h  ?? 0;
  const sells   = token.sells24h ?? 0;
  const vBuy    = token.vBuy24h  ?? 0;
  const vSell   = token.vSell24h ?? 0;
  const buyers  = Math.round(buys  * 0.65);
  const sellers = Math.round(sells * 0.65);
  const hasFlow = buys > 0 || sells > 0 || vBuy > 0 || vSell > 0;

  return (
    <div className="flex flex-col gap-4 px-2.5 py-3">

      {/* About section */}
      {token.description && (
        <div>
          <p className="mb-1.5 text-[15px] font-semibold text-text-primary">
            About {token.name}
          </p>
          <p className="text-[12px] leading-relaxed text-text-secondary">
            {expanded || token.description.length <= 120
              ? token.description
              : token.description.slice(0, 120) + "… "}
            {token.description.length > 120 && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="font-semibold text-accent-primary hover:opacity-80"
              >
                {expanded ? "Less" : "Read more"}
              </button>
            )}
          </p>
        </div>
      )}

      {/* Period performance — 4-column horizontal */}
      <div
        className="grid grid-cols-4 overflow-hidden rounded-xl"
        style={{ border: "1px solid var(--bg-tertiary)" }}
      >
        {PERIODS.map((p, i) => {
          const v = perf[p.key];
          const up = (v ?? 0) >= 0;
          const isNull = v == null;
          const color = isNull
            ? "var(--text-tertiary)"
            : up
            ? "var(--color-green)"
            : "var(--color-red)";
          const isActive = activePeriod === p.key;

          return (
            <button
              key={p.key}
              onClick={() => setActivePeriod(p.key)}
              className={`flex flex-col items-center gap-1 py-3 transition-colors ${
                i > 0 ? "border-l border-bg-tertiary" : ""
              }`}
              style={{
                background: isActive
                  ? "var(--bg-tertiary-solid)"
                  : "var(--bg-secondary)",
              }}
            >
              <span className="text-[11px] font-medium text-text-secondary">
                {p.label}
              </span>
              <span
                className="font-mono text-[12px] font-bold leading-none"
                style={{ color }}
              >
                {isNull
                  ? "—"
                  : `${up ? "▲" : "▼"}${Math.abs(v).toFixed(2)}%`}
              </span>
            </button>
          );
        })}
      </div>

      {/* 24H flow bars */}
      {hasFlow && (
        <div className="space-y-4">
          <SplitBar
            left={buys}   right={sells}
            leftLabel={`${compact(buys)} buys`}
            rightLabel={`${compact(sells)} sells`}
          />
          <SplitBar
            left={vBuy}   right={vSell}
            leftLabel={`$${compact(vBuy)} vol.`}
            rightLabel={`$${compact(vSell)} vol.`}
          />
          <SplitBar
            left={buyers} right={sellers}
            leftLabel={`${compact(buyers)} buyers`}
            rightLabel={`${compact(sellers)} sellers`}
          />
        </div>
      )}

      {/* View more */}
      <div className="flex justify-center">
        <button
          className="rounded-lg px-5 py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:text-text-primary"
          style={{ background: "var(--bg-tertiary-solid)" }}
        >
          View more
        </button>
      </div>
    </div>
  );
}
