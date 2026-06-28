"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { compact, formatUsd, relativeTime, truncateAddress } from "@/lib/format";
import { getTokenTrades, getTokenHolders, getTopTraders } from "@/lib/birdeye";
import type { TradePrint, Holder, TopTrader } from "@/lib/types";

export function LiveTrades({ address }: { address?: string }) {
  const [prints, setPrints] = useState<TradePrint[]>([]);
  const [status, setStatus] = useState<"loading" | "live" | "empty">("loading");

  useEffect(() => {
    if (!address) { setStatus("empty"); return; }
    let active = true;
    setStatus("loading");
    setPrints([]);

    async function poll() {
      const trades = await getTokenTrades(address!);
      if (!active) return;
      if (trades.length) {
        setPrints(trades.slice(0, 20).map((t) => ({
          id: t.id, side: t.side,
          amountUsd: t.amountUsd, price: t.price,
          maker: t.maker, timestamp: t.timestamp,
        })));
        setStatus("live");
      } else {
        setStatus((s) => (s === "live" ? "live" : "empty"));
      }
    }

    poll();
    const id = setInterval(poll, 30_000);
    return () => { active = false; clearInterval(id); };
  }, [address]);

  if (status === "loading") {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-[12px] text-text-tertiary">
        <Loader2 size={13} className="animate-spin" /> Loading trades…
      </div>
    );
  }

  if (status === "empty") {
    return (
      <div className="flex h-full items-center justify-center text-[12px] text-text-tertiary">
        No recent trades available
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Column headers */}
      <div className="sticky top-0 grid grid-cols-3 border-b border-bg-tertiary bg-bg-secondary px-3 py-1.5">
        {["Type / Time", "Price", "Value"].map((h, i) => (
          <span
            key={h}
            className={`text-[10px] font-bold uppercase tracking-wider text-text-tertiary ${i > 0 ? "text-right" : ""}`}
          >
            {h}
          </span>
        ))}
      </div>

      <div className="flex flex-col">
        <AnimatePresence initial={false}>
          {prints.map((t) => {
            const buy = t.side === "buy";
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, backgroundColor: buy ? "rgba(20,241,149,0.10)" : "rgba(255,75,75,0.10)" }}
                animate={{ opacity: 1, backgroundColor: "rgba(0,0,0,0)" }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-3 items-center px-3 py-1.5 hover:bg-bg-secondary"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-[12px] font-semibold capitalize"
                    style={{ color: buy ? "var(--color-green)" : "var(--color-red)" }}
                  >
                    {t.side}
                  </span>
                  <span className="font-mono text-[10px] text-text-tertiary">
                    {relativeTime(t.timestamp)}
                  </span>
                </div>
                <span className="text-right font-mono text-[12px] text-text-secondary">
                  {t.price > 0 ? `$${t.price < 0.01 ? t.price.toFixed(6) : t.price.toFixed(4)}` : "—"}
                </span>
                <span className="text-right font-mono text-[12px] text-text-primary">
                  {t.amountUsd > 0 ? formatUsd(t.amountUsd) : "—"}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function HoldersList({
  address,
  supply,
  holderCount,
}: {
  address?: string;
  supply?: number;
  holderCount?: number;
}) {
  const [holders, setHolders] = useState<Holder[]>([]);
  const [status, setStatus] = useState<"loading" | "live" | "empty">("loading");

  useEffect(() => {
    if (!address) { setStatus("empty"); return; }
    let active = true;
    setStatus("loading");
    setHolders([]);

    getTokenHolders(address, supply).then((hs) => {
      if (!active) return;
      if (hs.length) {
        setHolders(hs.map((h) => ({ address: h.address, pct: Number(h.pct.toFixed(2)), amount: h.amount })));
        setStatus("live");
      } else {
        setStatus("empty");
      }
    });

    return () => { active = false; };
  }, [address, supply]);

  if (status === "loading") {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-[12px] text-text-tertiary">
        <Loader2 size={13} className="animate-spin" /> Loading holders…
      </div>
    );
  }

  if (status === "empty") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="opacity-30">
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="17" cy="9" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M1 21c0-4 3.6-7 8-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M23 21c0-3.3-2.7-6-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {holderCount != null && holderCount > 0 ? (
          <>
            <p className="text-[13px] font-semibold text-text-primary">
              {holderCount.toLocaleString()} holders
            </p>
            <p className="text-[11px] text-text-tertiary">
              Holder distribution data is temporarily unavailable
            </p>
          </>
        ) : (
          <p className="text-[12px] text-text-tertiary">Holder data unavailable</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-px px-3 py-2">
      {holders.map((h, i) => (
        <div key={i} className="flex items-center gap-3 py-1.5">
          <span className="w-5 shrink-0 text-center font-mono text-[10px] text-text-tertiary">
            {i + 1}
          </span>
          <span className="w-24 shrink-0 font-mono text-[11px] text-text-secondary">
            {truncateAddress(h.address, 4, 4)}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-tertiary">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, h.pct * 6)}%`,
                background: "linear-gradient(90deg, var(--accent-primary), #14F195)",
              }}
            />
          </div>
          <span className="w-12 shrink-0 text-right font-mono text-[11px] text-text-primary">
            {h.pct}%
          </span>
          <span className="hidden w-14 shrink-0 text-right font-mono text-[10px] text-text-tertiary sm:block">
            {compact(h.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TopTradersList({ address }: { address?: string }) {
  const [traders, setTraders] = useState<TopTrader[]>([]);
  const [status, setStatus] = useState<"loading" | "live" | "empty">("loading");

  useEffect(() => {
    if (!address) { setStatus("empty"); return; }
    let active = true;
    setStatus("loading");
    setTraders([]);

    getTopTraders(address).then((ts) => {
      if (!active) return;
      if (ts.length) { setTraders(ts); setStatus("live"); }
      else setStatus("empty");
    });

    return () => { active = false; };
  }, [address]);

  if (status === "loading") {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-[12px] text-text-tertiary">
        <Loader2 size={13} className="animate-spin" /> Loading traders…
      </div>
    );
  }

  if (status === "empty") {
    return (
      <div className="flex h-full items-center justify-center text-[12px] text-text-tertiary">
        Trader data unavailable
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 grid grid-cols-4 border-b border-bg-tertiary bg-bg-secondary px-3 py-1.5">
        {["Wallet", "Volume", "Trades", "PnL"].map((h, i) => (
          <span
            key={h}
            className={`text-[10px] font-bold uppercase tracking-wider text-text-tertiary ${i > 0 ? "text-right" : ""}`}
          >
            {h}
          </span>
        ))}
      </div>
      <div className="flex flex-col">
        {traders.map((t, i) => {
          const pnlUp = t.pnl >= 0;
          return (
            <div key={i} className="grid grid-cols-4 items-center px-3 py-1.5 hover:bg-bg-secondary">
              <span className="font-mono text-[11px] text-text-secondary">
                {truncateAddress(t.address, 4, 4)}
              </span>
              <span className="text-right font-mono text-[12px] text-text-primary">
                {formatUsd(t.volume)}
              </span>
              <span className="text-right font-mono text-[11px] text-text-tertiary">
                {t.buy}B / {t.sell}S
              </span>
              <span
                className="text-right font-mono text-[12px] font-medium"
                style={{ color: t.pnl === 0 ? "var(--text-tertiary)" : pnlUp ? "var(--color-green)" : "var(--color-red)" }}
              >
                {t.pnl === 0 ? "—" : `${pnlUp ? "+" : ""}${formatUsd(t.pnl)}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
