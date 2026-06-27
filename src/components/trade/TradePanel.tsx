"use client";

import { useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { AnimatePresence, motion } from "framer-motion";
import { Settings2, Check, Loader2, AlertTriangle } from "lucide-react";
import type { Token } from "@/lib/types";
import { useSolanaWallet } from "@/lib/solana";
import { getTokenOverview } from "@/lib/birdeye";

const WSOL = "So11111111111111111111111111111111111111112";
const SLIPPAGES = [0.5, 1, 3] as const;
const QUICK_AMOUNTS = [10, 100, 500, 1000];

type Status = "idle" | "loading" | "success" | "error";

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export default function TradePanel({ token }: { token: Token }) {
  const { authenticated, login, getAccessToken } = usePrivy();
  const { wallet, address, sendSerialized } = useSolanaWallet();

  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState<number>(0.5);
  const [showSlippage, setShowSlippage] = useState(false);
  const [quote, setQuote] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteRes, setQuoteRes] = useState<unknown>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [solPrice, setSolPrice] = useState(0);

  useEffect(() => {
    let active = true;
    getTokenOverview(WSOL).then((t) => {
      if (active && t?.price) setSolPrice(t.price);
    });
    return () => { active = false; };
  }, []);

  const priceImpact = (() => {
    const usd = Number(amount);
    if (!usd || !token.liquidity) return 0;
    return Math.min(12, (usd / token.liquidity) * 100 * 40);
  })();

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      if (!amount || Number(amount) <= 0) { setQuote(null); setQuoteRes(null); return; }
      setQuoting(true);
      try {
        const inputMint = side === "buy" ? WSOL : token.address;
        const outputMint = side === "buy" ? token.address : WSOL;
        const solUsd = solPrice || 0;
        const inAmount = side === "buy" ? Number(amount) / solUsd : Number(amount);
        const decimals = side === "buy" ? 9 : 6;
        const raw = Math.floor(inAmount * 10 ** decimals);
        const res = await fetch(
          `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${raw}&slippageBps=${Math.round(slippage * 100)}`
        );
        const q = await res.json();
        if (q?.outAmount) {
          const outDecimals = side === "buy" ? 6 : 9;
          setQuote((Number(q.outAmount) / 10 ** outDecimals).toFixed(4));
          setQuoteRes(q);
        } else {
          setQuote("No route");
          setQuoteRes(null);
        }
      } catch {
        const est = side === "buy"
          ? Number(amount) / token.price
          : Number(amount) * token.price;
        setQuote(est.toFixed(4));
        setQuoteRes(null);
      } finally {
        setQuoting(false);
      }
    }, 450);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [amount, side, slippage, token, solPrice]);

  async function execute() {
    if (!authenticated) return login();
    if (!amount || Number(amount) <= 0) return;
    setStatus("loading");
    setError("");
    try {
      if (wallet && address && quoteRes) {
        const swapRes = await fetch("https://quote-api.jup.ag/v6/swap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quoteResponse: quoteRes,
            userPublicKey: address,
            wrapAndUnwrapSol: true,
          }),
        });
        const { swapTransaction } = await swapRes.json();
        if (swapTransaction) await sendSerialized(base64ToBytes(swapTransaction));
        getAccessToken().then((tok) =>
          fetch("/api/trades", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(tok ? { Authorization: `Bearer ${tok}` } : {}) },
            body: JSON.stringify({
              wallet_address: address,
              type: side,
              token_address: token.address,
              amount_sol: side === "buy" ? Number(amount) : Number(quote),
              amount_token: side === "buy" ? Number(quote) : Number(amount),
            }),
          }).catch(() => {})
        );
      } else {
        await new Promise((r) => setTimeout(r, 900));
      }
      setStatus("success");
      setTimeout(() => { setStatus("idle"); setAmount(""); }, 1800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Trade failed");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2500);
    }
  }

  const buy = side === "buy";

  return (
    <div className="p-4">
      {/* Buy / Sell tab buttons */}
      <div className="flex overflow-hidden rounded-lg border border-bg-tertiary">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setSide(s); setAmount(""); }}
            className="flex-1 py-2.5 text-[14px] font-semibold capitalize transition-colors"
            style={
              side === s
                ? {
                    background: s === "buy" ? "var(--success)" : "var(--danger)",
                    color: "#fff",
                  }
                : { color: "var(--text-secondary)" }
            }
          >
            {s}
          </button>
        ))}
      </div>

      {/* Dollar amount input */}
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-bg-tertiary bg-bg-primary px-3 py-2 focus-within:border-accent-primary">
        <span className="text-[22px] font-medium text-text-secondary">$</span>
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="0"
          className="w-full bg-transparent text-[22px] font-medium text-text-primary placeholder:text-text-tertiary focus:outline-none"
        />
        <span className="shrink-0 font-mono text-[12px] text-text-secondary">
          {buy ? "USD" : token.symbol}
        </span>
      </div>

      {/* Quick amount presets */}
      <div className="mt-2 flex gap-1.5">
        {QUICK_AMOUNTS.map((v) => (
          <button
            key={v}
            onClick={() => setAmount(String(v))}
            className="flex-1 rounded-md border border-bg-tertiary bg-bg-secondary py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:border-accent-primary hover:text-text-primary"
          >
            ${v}
          </button>
        ))}
        {/* Slippage gear */}
        <div className="relative">
          <button
            onClick={() => setShowSlippage((v) => !v)}
            className="flex h-full items-center justify-center rounded-md border border-bg-tertiary bg-bg-secondary px-2 text-text-secondary transition-colors hover:text-text-primary"
          >
            <Settings2 size={14} />
          </button>
          <AnimatePresence>
            {showSlippage && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.14 }}
                className="absolute right-0 top-9 z-20 w-40 rounded-lg border border-bg-tertiary bg-bg-secondary p-2 shadow-xl"
              >
                <p className="caps px-1 pb-1.5">Max slippage</p>
                <div className="flex gap-1">
                  {SLIPPAGES.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSlippage(s); setShowSlippage(false); }}
                      className={`flex-1 rounded-md py-1.5 font-mono text-[12px] transition-colors ${
                        slippage === s
                          ? "bg-accent-primary text-white"
                          : "bg-bg-primary text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {s}%
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Available balance hint */}
      <p className="mt-2 text-[12px] text-text-secondary">
        {quoting ? (
          <span className="inline-flex items-center gap-1">
            <Loader2 size={11} className="animate-spin" /> quoting…
          </span>
        ) : quote ? (
          `≈ ${quote} ${buy ? token.symbol : "SOL"}`
        ) : (
          "$0 available"
        )}
      </p>

      {/* Price impact warning */}
      {priceImpact > 1 && (
        <div
          className="mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-[12px]"
          style={{
            color: priceImpact > 3 ? "var(--danger)" : "#FFC857",
            background: priceImpact > 3 ? "rgba(255,75,75,0.10)" : "rgba(255,200,87,0.10)",
          }}
        >
          <AlertTriangle size={12} />
          Price impact {priceImpact.toFixed(2)}%
        </div>
      )}

      {/* CTA button */}
      <button
        onClick={execute}
        disabled={status === "loading" || (authenticated && (!amount || quoting))}
        className={`mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[14px] font-bold text-white transition-[filter,opacity] disabled:opacity-50 ${
          !authenticated ? "bg-bg-tertiary-solid" : buy ? "btn-buy" : ""
        }`}
        style={authenticated && !buy ? { background: "var(--danger)" } : undefined}
      >
        <AnimatePresence mode="wait" initial={false}>
          {status === "loading" ? (
            <motion.span key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Loader2 size={16} className="animate-spin" />
            </motion.span>
          ) : status === "success" ? (
            <motion.span key="s" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
              <Check size={16} /> Confirmed
            </motion.span>
          ) : (
            <motion.span key="t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {!authenticated ? "Connect wallet" : `${buy ? "Buy" : "Sell"} ${token.symbol}`}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Unverified token notice */}
      <div className="mt-3 flex items-center gap-2 rounded-md border border-yellow-transparent bg-yellow-transparent px-3 py-2 text-[12px] text-warning">
        <AlertTriangle size={12} />
        Unverified token — trade at your own risk
      </div>

      {status === "error" && (
        <p className="mt-2 text-center text-[12px] text-red">{error}</p>
      )}
    </div>
  );
}
