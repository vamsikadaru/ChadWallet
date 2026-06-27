"use client";

import { useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { AnimatePresence, motion } from "framer-motion";
import { Settings2, Check, Loader2, AlertTriangle, Info } from "lucide-react";
import type { Token } from "@/lib/types";
import { useSolanaWallet } from "@/lib/solana";
import { getTokenOverview } from "@/lib/birdeye";
import { usePortfolio } from "@/lib/usePortfolio";

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
  const { netWorth, holdings } = usePortfolio();
  const tokenBalance = holdings.find((h) => h.token.address === token.address)?.balance ?? 0;

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
        const inputMint  = side === "buy" ? WSOL : token.address;
        const outputMint = side === "buy" ? token.address : WSOL;
        const solUsd  = solPrice || 0;
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
  const amt = Number(amount);
  const isBelowMin     = authenticated && amt > 0 && amt < 2;
  const isInsufficient = authenticated && amt > 0 && netWorth < amt;

  return (
    <div className="flex flex-col">

      {/* ── Buy / Sell tabs ── */}
      <div className="px-2.5 pt-2.5 pb-2">
        <div
          className="relative flex rounded-xl p-1"
          style={{ background: "var(--bg-tertiary-solid)" }}
        >
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
            className="absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-lg"
            style={{
              left: buy ? "4px" : "calc(50%)",
              background: buy ? "rgba(20,241,149,0.18)" : "rgba(255,75,75,0.18)",
              border: `1px solid ${buy ? "rgba(20,241,149,0.30)" : "rgba(255,75,75,0.30)"}`,
            }}
          />
          {(["buy", "sell"] as const).map((s) => {
            const disabled = s === "sell" && tokenBalance === 0;
            return (
              <button
                key={s}
                onClick={() => { if (!disabled) { setSide(s); setAmount(""); } }}
                disabled={disabled}
                className="relative z-10 flex-1 py-2.5 text-[14px] font-bold capitalize transition-colors disabled:cursor-not-allowed"
                style={
                  disabled
                    ? { color: "var(--text-tertiary)" }
                    : side === s
                    ? { color: s === "buy" ? "var(--color-green)" : "var(--color-red)" }
                    : { color: "var(--text-secondary)" }
                }
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 px-2.5 pb-2.5">

        {/* ── Amount input ── */}
        <div
          className="flex items-center justify-between rounded-xl border px-4 py-3"
          style={{ background: "var(--bg-primary)", borderColor: "var(--bg-tertiary-solid)" }}
        >
          <div className="flex items-baseline gap-0.5">
            <span className="text-[22px] font-semibold" style={{ color: amount ? "var(--text-primary)" : "var(--text-tertiary)" }}>
              $
            </span>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0"
              className="min-w-0 w-20 bg-transparent text-[22px] font-semibold text-text-primary placeholder:text-text-tertiary focus:outline-none"
            />
          </div>
          <span className="shrink-0 text-[13px] text-text-tertiary">
            {amount
              ? quoting
                ? "…"
                : quote
                ? `≈ ${quote} ${buy ? token.symbol : "SOL"}`
                : ""
              : "Enter amount"}
          </span>
        </div>

        {/* ── Quick amount chips + settings gear ── */}
        <div className="grid grid-cols-5 gap-1.5">
          {QUICK_AMOUNTS.map((v) => (
            <button
              key={v}
              onClick={() => setAmount(String(v))}
              className="rounded-lg py-1.5 text-center text-[12px] font-semibold transition-colors"
              style={
                amount === String(v)
                  ? {
                      background: buy ? "rgba(20,241,149,0.15)" : "rgba(255,75,75,0.15)",
                      color: buy ? "var(--color-green)" : "var(--color-red)",
                    }
                  : { background: "var(--bg-tertiary-solid)", color: "var(--text-secondary)" }
              }
            >
              ${v}
            </button>
          ))}
          <button
            onClick={() => setShowSlippage((v) => !v)}
            className="flex items-center justify-center rounded-lg py-1.5 transition-colors"
            style={
              showSlippage
                ? { background: "var(--bg-tertiary-solid)", color: "var(--text-primary)" }
                : { background: "var(--bg-tertiary-solid)", color: "var(--text-tertiary)" }
            }
            title={`Slippage: ${slippage}%`}
          >
            <Settings2 size={14} />
          </button>
        </div>

        {/* Slippage panel */}
        <AnimatePresence>
          {showSlippage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="flex gap-1.5 rounded-xl border border-bg-tertiary bg-bg-secondary p-2">
                <span className="flex items-center px-1 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                  Slippage
                </span>
                <div className="flex flex-1 gap-1">
                  {SLIPPAGES.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSlippage(s); setShowSlippage(false); }}
                      className="flex-1 rounded-lg py-1.5 font-mono text-[12px] font-medium transition-colors"
                      style={
                        slippage === s
                          ? {
                              background: buy ? "rgba(20,241,149,0.15)" : "rgba(255,75,75,0.15)",
                              color: buy ? "var(--color-green)" : "var(--color-red)",
                            }
                          : { color: "var(--text-secondary)" }
                      }
                    >
                      {s}%
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Available balance ── */}
        <p className="text-[12px] text-text-secondary">
          ${netWorth > 0 ? netWorth.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "0"} available
        </p>

        {/* ── Insufficient balance error ── */}
        {isInsufficient && (
          <p className="text-[13px] font-medium" style={{ color: "var(--color-red)" }}>
            Insufficient cash balance
          </p>
        )}

        {/* ── Price impact warning ── */}
        {priceImpact > 1 && (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px]"
            style={{
              color: priceImpact > 3 ? "var(--color-red)" : "var(--color-warning)",
              background: priceImpact > 3 ? "rgba(255,75,75,0.08)" : "rgba(255,199,79,0.08)",
            }}
          >
            <AlertTriangle size={12} />
            Price impact {priceImpact.toFixed(2)}%
          </div>
        )}

        {/* ── CTA button ── */}
        <button
          onClick={execute}
          disabled={status === "loading" || isBelowMin || isInsufficient || (authenticated && (!amount || quoting))}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-bold transition-[filter,opacity] disabled:opacity-100"
          style={
            isBelowMin || isInsufficient
              ? { background: "var(--bg-tertiary-solid)", color: "var(--text-secondary)" }
              : !authenticated
              ? { background: "var(--bg-tertiary-solid)", color: "var(--text-secondary)" }
              : buy
              ? { background: "var(--color-green)", color: "#000" }
              : { background: "var(--color-red)", color: "#fff" }
          }
        >
          <AnimatePresence mode="wait" initial={false}>
            {status === "loading" ? (
              <motion.span key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Loader2 size={16} className="animate-spin" />
              </motion.span>
            ) : status === "success" ? (
              <motion.span key="s" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                <Check size={16} /> Confirmed
              </motion.span>
            ) : isBelowMin ? (
              <motion.span key="min" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Minimum amount $2
              </motion.span>
            ) : isInsufficient ? (
              <motion.span key="ins" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {buy ? "Buy" : "Sell"} {token.symbol}
              </motion.span>
            ) : (
              <motion.span key="t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {!authenticated ? "Connect wallet" : `${buy ? "Buy" : "Sell"} ${token.symbol}`}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* ── Unverified notice ── */}
        <div
          className="flex items-center justify-between rounded-lg px-3 py-2 text-[12px]"
          style={{
            color: "var(--color-warning)",
            background: "rgba(255,199,79,0.06)",
            border: "1px solid rgba(255,199,79,0.10)",
          }}
        >
          <span className="flex items-center gap-2">
            <AlertTriangle size={12} className="shrink-0" />
            Unverified token
          </span>
          <Info size={13} className="shrink-0 opacity-60" />
        </div>

        {status === "error" && (
          <p className="text-center text-[12px] text-red">{error}</p>
        )}
      </div>
    </div>
  );
}
