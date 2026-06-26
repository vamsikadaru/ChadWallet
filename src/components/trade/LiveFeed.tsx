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
    if (!address) {
      setStatus("empty");
      return;
    }
    let active = true;
    setStatus("loading");
    setPrints([]);

    async function poll() {
      const trades = await getTokenTrades(address!);
      if (!active) return;
      if (trades.length) {
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
        setStatus("live");
      } else {
        setStatus((s) => (s === "live" ? "live" : "empty"));
      }
    }

    poll();
    const id = setInterval(poll, 8000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [address]);

  return (
    <div className="glass flex flex-col p-5">
      <div className="mb-3 flex items-center gap-2">
        {status === "live" && (
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-success" />
        )}
        <span className="caps">
          {status === "live" ? "Live trades" : "Trades"}
        </span>
      </div>

      {status === "loading" && (
        <div className="flex h-[200px] items-center justify-center gap-2 text-[13px] text-text-3">
          <Loader2 size={14} className="animate-spin" /> Loading trades…
        </div>
      )}

      {status === "empty" && (
        <div className="flex h-[200px] items-center justify-center text-[13px] text-text-3">
          No recent trades available
        </div>
      )}

      {status === "live" && (
        <>
          <div className="grid grid-cols-3 px-1 pb-2">
            {["Type / Time", "Price", "Value"].map((h, i) => (
              <span key={h} className={`caps ${i === 0 ? "text-left" : "text-right"}`}>
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
        </>
      )}
    </div>
  );
}

export function HoldersList({
  address,
  supply,
}: {
  address?: string;
  supply?: number;
}) {
  const [holders, setHolders] = useState<Holder[]>([]);
  const [status, setStatus] = useState<"loading" | "live" | "empty">("loading");

  useEffect(() => {
    if (!address) {
      setStatus("empty");
      return;
    }
    let active = true;
    setStatus("loading");
    setHolders([]);

    getTokenHolders(address, supply).then((hs) => {
      if (!active) return;
      if (hs.length) {
        setHolders(
          hs.map((h) => ({
            address: h.address,
            pct: Number(h.pct.toFixed(2)),
            amount: h.amount,
          }))
        );
        setStatus("live");
      } else {
        setStatus("empty");
      }
    });

    return () => {
      active = false;
    };
  }, [address, supply]);

  return (
    <div className="glass flex flex-col p-5">
      <div className="mb-3 flex items-center gap-2">
        {status === "live" && (
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-success" />
        )}
        <span className="caps">Top holders</span>
      </div>

      {status === "loading" && (
        <div className="flex h-[200px] items-center justify-center gap-2 text-[13px] text-text-3">
          <Loader2 size={14} className="animate-spin" /> Loading holders…
        </div>
      )}

      {status === "empty" && (
        <div className="flex h-[200px] items-center justify-center text-[13px] text-text-3">
          Holder data unavailable
        </div>
      )}

      {status === "live" && (
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
      )}
    </div>
  );
}

/** Top 10 traders for this token by 24h volume, with PnL colouring. */
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

  return (
    <div className="glass flex flex-col p-5">
      <div className="mb-3 flex items-center gap-2">
        {status === "live" && <span className="live-dot h-1.5 w-1.5 rounded-full bg-success" />}
        <span className="caps">Top traders</span>
      </div>

      {status === "loading" && (
        <div className="flex h-[200px] items-center justify-center gap-2 text-[13px] text-text-3">
          <Loader2 size={14} className="animate-spin" /> Loading traders…
        </div>
      )}
      {status === "empty" && (
        <div className="flex h-[200px] items-center justify-center text-[13px] text-text-3">
          Trader data unavailable
        </div>
      )}

      {status === "live" && (
        <>
          <div className="grid grid-cols-4 px-1 pb-2">
            {["Wallet", "Volume", "Trades", "PnL"].map((h, i) => (
              <span key={h} className={`caps ${i === 0 ? "text-left" : "text-right"}`}>{h}</span>
            ))}
          </div>
          <div className="max-h-[280px] space-y-px overflow-y-auto custom-scrollbar">
            {traders.map((t, i) => {
              const pnlUp = t.pnl >= 0;
              return (
                <div
                  key={i}
                  className="grid grid-cols-4 items-center rounded-[var(--radius-sm)] px-1 py-1.5"
                >
                  <span className="font-mono text-[12px] text-text-2">
                    {truncateAddress(t.address, 4, 4)}
                  </span>
                  <span className="text-right font-mono text-[12px] text-text-1">
                    {formatUsd(t.volume)}
                  </span>
                  <span className="text-right font-mono text-[12px] text-text-3">
                    {t.buy}B / {t.sell}S
                  </span>
                  <span
                    className="text-right font-mono text-[12px] font-medium"
                    style={{ color: t.pnl === 0 ? "var(--text-3)" : pnlUp ? "var(--success)" : "var(--danger)" }}
                  >
                    {t.pnl === 0 ? "—" : `${pnlUp ? "+" : ""}${formatUsd(t.pnl)}`}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
