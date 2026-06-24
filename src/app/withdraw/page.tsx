"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, ArrowUpFromLine } from "lucide-react";
import { FadeIn, EASE } from "@/components/ui/motion";
import { useSolanaWallet } from "@/lib/solana";
import { getTokenOverview } from "@/lib/birdeye";
import { formatUsd } from "@/lib/format";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const FEE_BUFFER = 0.000015; // leave room for the network fee

type Status = "idle" | "loading" | "success" | "error";

export default function WithdrawPage() {
  const { address, sendSerialized } = useSolanaWallet();
  const [balance, setBalance] = useState(0);
  const [solPrice, setSolPrice] = useState(0);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [sig, setSig] = useState("");

  // Live SOL balance + price.
  useEffect(() => {
    let active = true;
    const rpc = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL;
    async function load() {
      if (!address || !rpc) return;
      const { Connection, PublicKey, LAMPORTS_PER_SOL } = await import(
        "@solana/web3.js"
      );
      const conn = new Connection(rpc, "confirmed");
      const lamports = await conn.getBalance(new PublicKey(address));
      if (active) setBalance(lamports / LAMPORTS_PER_SOL);
    }
    load();
    getTokenOverview(SOL_MINT).then((t) => {
      if (active && t?.price) setSolPrice(t.price);
    });
    return () => {
      active = false;
    };
  }, [address, status]);

  const num = Number(amount) || 0;
  const validRecipient = BASE58.test(recipient.trim());
  const overBalance = num > Math.max(0, balance - FEE_BUFFER);
  const canSubmit =
    num > 0 && validRecipient && !overBalance && status !== "loading";

  const setPct = (pct: number) => {
    const max = Math.max(0, balance - FEE_BUFFER);
    setAmount((max * pct).toFixed(4));
  };

  async function submit() {
    if (!address || !canSubmit) return;
    setStatus("loading");
    setError("");
    try {
      const rpc = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL!;
      const {
        Connection,
        PublicKey,
        SystemProgram,
        Transaction,
        LAMPORTS_PER_SOL,
      } = await import("@solana/web3.js");
      const conn = new Connection(rpc, "confirmed");
      const from = new PublicKey(address);
      const to = new PublicKey(recipient.trim());
      const { blockhash } = await conn.getLatestBlockhash();

      const tx = new Transaction();
      tx.recentBlockhash = blockhash;
      tx.feePayer = from;
      tx.add(
        SystemProgram.transfer({
          fromPubkey: from,
          toPubkey: to,
          lamports: Math.floor(num * LAMPORTS_PER_SOL),
        })
      );

      const serialized = tx.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      const signature = await sendSerialized(new Uint8Array(serialized));
      setSig(
        Array.from(signature.slice(0, 8))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
      );
      setStatus("success");
      setAmount("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Withdrawal failed");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-7">
      <FadeIn>
        <p className="caps">Move funds out</p>
        <h1 className="font-display text-[28px] font-bold tracking-tight">Withdraw</h1>
      </FadeIn>

      <FadeIn delay={0.05}>
        <div className="glass min-h-[360px] p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="flex flex-col items-center py-8 text-center"
              >
                <div className="grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success">
                  <Check size={30} />
                </div>
                <h2 className="mt-5 font-display text-[20px] font-bold">
                  Withdrawal sent
                </h2>
                <p className="mt-1.5 max-w-[320px] text-[13px] leading-relaxed text-text-2">
                  Your SOL is on its way. It usually confirms within a few seconds.
                </p>
                {sig && (
                  <p className="mt-3 font-mono text-[11px] text-text-3">
                    ref {sig}
                  </p>
                )}
                <div className="mt-7 flex gap-3">
                  <button
                    onClick={() => setStatus("idle")}
                    className="flex h-11 items-center rounded-[var(--radius-pill)] border border-border px-5 text-[14px] text-text-1 transition-colors hover:border-[var(--border-bright)]"
                  >
                    Withdraw again
                  </button>
                  <Link
                    href="/"
                    className="btn-buy flex h-11 items-center rounded-[var(--radius-pill)] px-5 text-[14px] font-semibold text-white"
                  >
                    View profile
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-5"
              >
                <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-bg-2/40 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-[12px] font-bold text-white">
                      ◎
                    </span>
                    <div>
                      <p className="text-[14px] font-medium">Available SOL</p>
                      <p className="font-mono text-[12px] text-text-2">
                        {balance.toFixed(4)} SOL
                        {solPrice > 0 && ` · ${formatUsd(balance * solPrice)}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="caps mb-2 block">Recipient address</label>
                  <input
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Solana wallet address"
                    className="w-full rounded-[var(--radius-md)] border border-border bg-bg-0/60 px-4 py-3 font-mono text-[13px] text-text-1 placeholder:text-text-3 focus:border-[var(--border-bright)] focus:outline-none"
                  />
                  {recipient && !validRecipient && (
                    <p className="mt-1.5 text-[12px] text-danger">
                      That doesn&apos;t look like a valid Solana address.
                    </p>
                  )}
                </div>

                <div>
                  <label className="caps mb-2 block">Amount (SOL)</label>
                  <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-bg-0/60 px-4 py-3 focus-within:border-[var(--border-bright)]">
                    <input
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) =>
                        setAmount(e.target.value.replace(/[^0-9.]/g, ""))
                      }
                      placeholder="0.00"
                      className="w-full bg-transparent font-mono text-[20px] font-medium text-text-1 placeholder:text-text-3 focus:outline-none"
                    />
                    <span className="font-mono text-[13px] text-text-2">SOL</span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {[
                      ["10%", 0.1],
                      ["25%", 0.25],
                      ["50%", 0.5],
                      ["Max", 1],
                    ].map(([label, pct]) => (
                      <button
                        key={label as string}
                        onClick={() => setPct(pct as number)}
                        className="flex-1 rounded-[var(--radius-sm)] border border-border bg-bg-2/40 py-1.5 font-mono text-[11px] text-text-2 transition-colors hover:text-text-1"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {overBalance && (
                    <p className="mt-1.5 text-[12px] text-danger">
                      Amount exceeds your available balance.
                    </p>
                  )}
                </div>

                <button
                  onClick={submit}
                  disabled={!canSubmit}
                  className="btn-buy flex h-[52px] w-full items-center justify-center gap-2 rounded-[var(--radius-md)] text-[15px] font-bold text-white transition-opacity disabled:opacity-50"
                >
                  {status === "loading" ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <ArrowUpFromLine size={17} /> Withdraw SOL
                    </>
                  )}
                </button>
                {status === "error" && (
                  <p className="text-center text-[12px] text-danger">{error}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </FadeIn>
    </div>
  );
}
