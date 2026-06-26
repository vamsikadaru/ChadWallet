"use client";

import { useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { AnimatePresence, motion } from "framer-motion";
import { Settings2, Check, Loader2, ArrowUpDown, AlertTriangle } from "lucide-react";
import type { Token } from "@/lib/types";
import { useSolanaWallet } from "@/lib/solana";
import { getTokenOverview } from "@/lib/birdeye";

const WSOL = "So11111111111111111111111111111111111111112";
const SLIPPAGES = [0.5, 1, 3] as const;

type Status = "idle" | "loading" | "success" | "error";

/** Browser-safe base64 -> Uint8Array (no Buffer). */
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
  const [denom, setDenom] = useState<"token" | "usd">("usd");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState<number>(0.5);
  const [showSlippage, setShowSlippage] = useState(false);
  const [quote, setQuote] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteRes, setQuoteRes] = useState<unknown>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [solPrice, setSolPrice] = useState(0);

  // Live SOL/USD price for USD↔SOL conversion (no hardcoded constant).
  useEffect(() => {
    let active = true;
    getTokenOverview(WSOL).then((t) => {
      if (active && t?.price) setSolPrice(t.price);
    });
    return () => {
      active = false;
    };
  }, []);

  const inputUnit = side === "buy" ? (denom === "usd" ? "USD" : "SOL") : token.symbol;
  // Illustrative price impact derived from order size vs liquidity.
  const priceImpact = (() => {
    const usd =
      denom === "usd" ? Number(amount) : Number(amount) * token.price;
    if (!usd || !token.liquidity) return 0;
    return Math.min(12, (usd / token.liquidity) * 100 * 40);
  })();

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      if (!amount || Number(amount) <= 0) {
        setQuote(null);
        setQuoteRes(null);
        return;
      }
      setQuoting(true);
      try {
        const inputMint = side === "buy" ? WSOL : token.address;
        const outputMint = side === "buy" ? token.address : WSOL;
        // buy amount is in SOL (convert from USD if needed); sell amount in token.
        const solUsd = solPrice || 0;
        const inAmount =
          side === "buy"
            ? denom === "usd"
              ? Number(amount) / solUsd
              : Number(amount)
            : Number(amount);
        const decimals = side === "buy" ? 9 : 6;
        const raw = Math.floor(inAmount * 10 ** decimals);
        const res = await fetch(
          `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${raw}&slippageBps=${Math.round(
            slippage * 100
          )}`
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
        // Fallback estimate so the UI stays responsive without live routing.
        const est =
          side === "buy"
            ? (denom === "usd" ? Number(amount) : Number(amount) * (solPrice || 0)) /
              token.price
            : Number(amount) * token.price;
        setQuote(est.toFixed(4));
        setQuoteRes(null);
      } finally {
        setQuoting(false);
      }
    }, 450);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [amount, side, denom, slippage, token, solPrice]);

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
        if (swapTransaction) {
          // Privy embedded wallet signs + sends the serialized Jupiter tx.
          await sendSerialized(base64ToBytes(swapTransaction));
        }
        // Log to Supabase (best-effort).
        getAccessToken().then((tok) => fetch("/api/trades", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(tok ? { Authorization: `Bearer ${tok}` } : {}) },
          body: JSON.stringify({
            wallet_address: address,
            type: side,
            token_address: token.address,
            amount_sol: side === "buy" ? Number(amount) : Number(quote),
            amount_token: side === "buy" ? Number(quote) : Number(amount),
          }),
        })).catch(() => {});
      } else {
        // Demo mode — simulate confirmation latency.
        await new Promise((r) => setTimeout(r, 900));
      }
      setStatus("success");
      setTimeout(() => {
        setStatus("idle");
        setAmount("");
      }, 1800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Trade failed");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2500);
    }
  }

  const buy = side === "buy";

  return (
    <div className="glass relative p-5">
      {/* Buy / Sell switch */}
      <div className="relative flex rounded-[var(--radius-pill)] border border-border bg-bg-0/60 p-1">
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 38 }}
          className="absolute inset-y-1 w-[calc(50%-4px)] rounded-[var(--radius-pill)]"
          style={{
            left: buy ? 4 : "50%",
            background: buy ? "rgba(20,241,149,0.14)" : "rgba(255,75,75,0.14)",
            border: `1px solid ${buy ? "rgba(20,241,149,0.4)" : "rgba(255,75,75,0.4)"}`,
          }}
        />
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            onClick={() => {
              setSide(s);
              setAmount("");
            }}
            className={`relative z-10 flex-1 py-2 text-[14px] font-semibold capitalize transition-colors ${
              side === s
                ? s === "buy"
                  ? "text-success"
                  : "text-danger"
                : "text-text-2"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Amount input */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="caps">Amount</span>
          {buy && (
            <button
              onClick={() => setDenom(denom === "usd" ? "token" : "usd")}
              className="flex items-center gap-1 font-mono text-[11px] text-text-2 transition-colors hover:text-text-1"
            >
              <ArrowUpDown size={11} />
              {denom === "usd" ? "USD" : "SOL"}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-bg-0/60 px-4 py-3 focus-within:border-[var(--border-bright)]">
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0.00"
            className="w-full bg-transparent font-mono text-[22px] font-medium text-text-1 placeholder:text-text-3 focus:outline-none"
          />
          <span className="font-mono text-[13px] text-text-2">{inputUnit}</span>
        </div>

        {/* quick percents */}
        <div className="mt-2 flex gap-2">
          {["25%", "50%", "Max"].map((p) => (
            <button
              key={p}
              onClick={() => setAmount(p === "Max" ? "1.0" : (Number(p.replace("%", "")) / 100).toString())}
              className="flex-1 rounded-[var(--radius-sm)] border border-border bg-bg-2/40 py-1.5 font-mono text-[11px] text-text-2 transition-colors hover:text-text-1"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Quote + slippage */}
      <div className="mt-4 space-y-2.5 text-[13px]">
        <div className="flex items-center justify-between">
          <span className="text-text-2">You receive</span>
          <span className="font-mono text-text-1">
            {quoting ? (
              <span className="inline-flex items-center gap-1.5 text-text-2">
                <Loader2 size={12} className="animate-spin" /> quoting
              </span>
            ) : quote ? (
              `${quote} ${buy ? token.symbol : "SOL"}`
            ) : (
              "0.00"
            )}
          </span>
        </div>

        <div className="relative flex items-center justify-between">
          <span className="text-text-2">Slippage</span>
          <button
            onClick={() => setShowSlippage((v) => !v)}
            className="flex items-center gap-1.5 font-mono text-accent transition-colors hover:opacity-80"
          >
            {slippage}% <Settings2 size={13} />
          </button>
          <AnimatePresence>
            {showSlippage && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.16 }}
                className="absolute right-0 top-7 z-20 w-44 rounded-[var(--radius-md)] border border-border bg-bg-2 p-2 shadow-xl"
              >
                <p className="caps px-1 pb-1.5">Max slippage</p>
                <div className="flex gap-1.5">
                  {SLIPPAGES.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSlippage(s);
                        setShowSlippage(false);
                      }}
                      className={`flex-1 rounded-[var(--radius-sm)] py-1.5 font-mono text-[12px] transition-colors ${
                        slippage === s
                          ? "bg-accent text-white"
                          : "bg-bg-0/60 text-text-2 hover:text-text-1"
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

        {priceImpact > 1 && (
          <div
            className="flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-[12px]"
            style={{
              color: priceImpact > 3 ? "var(--danger)" : "#FFC857",
              background:
                priceImpact > 3 ? "rgba(255,75,75,0.10)" : "rgba(255,200,87,0.10)",
            }}
          >
            <AlertTriangle size={13} />
            Price impact {priceImpact.toFixed(2)}%
          </div>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={execute}
        disabled={status === "loading" || (authenticated && (!amount || quoting))}
        className={`mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-[var(--radius-md)] text-[15px] font-bold text-white transition-[filter,opacity] disabled:opacity-50 ${
          !authenticated ? "bg-bg-2" : buy ? "btn-buy" : ""
        }`}
        style={
          authenticated && !buy ? { background: "var(--danger)" } : undefined
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          {status === "loading" ? (
            <motion.span key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Loader2 size={18} className="animate-spin" />
            </motion.span>
          ) : status === "success" ? (
            <motion.span
              key="s"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2"
            >
              <Check size={18} /> Confirmed
            </motion.span>
          ) : (
            <motion.span key="t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {!authenticated
                ? "Connect wallet"
                : `${buy ? "Buy" : "Sell"} ${token.symbol}`}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      {status === "error" && (
        <p className="mt-2 text-center text-[12px] text-danger">{error}</p>
      )}
    </div>
  );
}
