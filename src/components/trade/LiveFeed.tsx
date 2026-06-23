"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { compact, formatUsd, relativeTime, truncateAddress } from "@/lib/format";
import { mockTradePrints, mockHolders } from "@/lib/mock";
import { getTokenTrades } from "@/lib/birdeye";
import type { TradePrint, Holder } from "@/lib/types";

/**
 * Live trades. Polls Birdeye for real swaps on this token every few seconds;
 * if the feed is unavailable (no key / unsupported tier) it falls back to a
 * simulated stream so the panel is never empty.
 */
export function LiveTrades({ address }: { address?: string }) {
  const [prints, setPrints] = useState<TradePrint[]>(() => mockTradePrints(14));
  const [live, setLive] = useState(false);

  useEffect(() => {
    let active = true;

    async function poll() {
      if (!address) return false;
      const trades = await getTokenTrades(address);
      if (!active || !trades.length) return false;
      setPrints(
        trades.slice(0, 16).map((t) => ({
          id: t.id,
          side: t.side,
          amountUsd: t.amountUsd,
          price: t.price,
          maker: t.maker,
          timestamp: t.timestamp,
        }))
      );
      return true;
    }

    async function tick() {
      const ok = await poll();
      if (active) setLive(ok);
      if (ok) return;
      // Fallback: synthesize a fresh print so the stream keeps moving.
      const buy = Math.random() > 0.5;
      setPrints((p) =>
        [
          {
            id: `print-${Date.now()}`,
            side: buy ? "buy" : "sell",
            amountUsd: Math.round(50 + Math.random() * 4000),
            price: 1 + Math.random() * 0.04,
            maker:
              Math.random().toString(36).slice(2, 6) +
              "..." +
              Math.random().toString(36).slice(2, 6),
            timestamp: Date.now(),
          } as TradePrint,
          ...p,
        ].slice(0, 16)
      );
    }

    tick();
    const id = setInterval(tick, address ? 6000 : 2200);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [address]);

  return (
    <div className="glass flex flex-col p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="live-dot h-1.5 w-1.5 rounded-full bg-success" />
        <span className="caps">{live ? "Live trades" : "Trade stream"}</span>
      </div>
      <div className="grid grid-cols-3 px-1 pb-2">
        {["Type / Time", "Price", "Value"].map((h, i) => (
          <span
            key={h}
            className={`caps ${i === 0 ? "text-left" : "text-right"}`}
          >
            {h}
          </span>
        ))}
      </div>
      <div className="max-h-[280px] space-y-px overflow-y-auto custom-scrollbar">
        <AnimatePresence initial={false}>
          {prints.map((t) => {
            const buy = t.side === "buy";
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -10, backgroundColor: buy ? "rgba(20,241,149,0.12)" : "rgba(255,75,75,0.12)" }}
                animate={{ opacity: 1, y: 0, backgroundColor: "rgba(0,0,0,0)" }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-3 items-center rounded-[var(--radius-sm)] px-1 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-[12px] font-semibold capitalize"
                    style={{ color: buy ? "var(--success)" : "var(--danger)" }}
                  >
                    {t.side}
                  </span>
                  <span className="font-mono text-[10px] text-text-3">
                    {relativeTime(t.timestamp)}
                  </span>
                </div>
                <span className="text-right font-mono text-[12px] text-text-2">
                  ${t.price.toFixed(4)}
                </span>
                <span className="text-right font-mono text-[12px] text-text-1">
                  {formatUsd(t.amountUsd)}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Top 20 holders with supply-share progress bars. */
export function HoldersList() {
  const [holders] = useState<Holder[]>(() => mockHolders());

  return (
    <div className="glass flex flex-col p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="caps">Top holders</span>
      </div>
      <div className="max-h-[280px] space-y-2 overflow-y-auto custom-scrollbar pr-1">
        {holders.map((h, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-5 shrink-0 font-mono text-[11px] text-text-3">
              {i + 1}
            </span>
            <span className="w-24 shrink-0 font-mono text-[12px] text-text-2">
              {truncateAddress(h.address, 4, 4)}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-2">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, h.pct * 6)}%`,
                  background: "linear-gradient(90deg, var(--accent), var(--accent-2))",
                }}
              />
            </div>
            <span className="w-12 shrink-0 text-right font-mono text-[11px] text-text-1">
              {h.pct}%
            </span>
            <span className="hidden w-14 shrink-0 text-right font-mono text-[11px] text-text-3 sm:block">
              {compact(h.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
