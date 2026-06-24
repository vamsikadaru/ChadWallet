"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSolanaWallet } from "@/lib/solana";
import QRCode from "react-qr-code";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Check, ChevronRight, ChevronLeft, Wallet } from "lucide-react";
import Link from "next/link";
import { FadeIn, EASE } from "@/components/ui/motion";
import { truncateAddress } from "@/lib/format";

const NETWORKS = [
  { id: "solana", name: "Solana", desc: "SOL & SPL tokens", enabled: true },
  { id: "eth", name: "Ethereum", desc: "Coming soon", enabled: false },
  { id: "base", name: "Base", desc: "Coming soon", enabled: false },
];

const STEPS = ["Network", "Address", "Done"];

export default function DepositPage() {
  const { user } = usePrivy();
  const { address: solAddress } = useSolanaWallet();
  const address = solAddress ?? user?.wallet?.address ?? "";

  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="mx-auto max-w-xl space-y-7">
      <FadeIn>
        <p className="caps">Add funds</p>
        <h1 className="font-display text-[28px] font-bold tracking-tight">Deposit</h1>
      </FadeIn>

      {/* Step indicator */}
      <FadeIn delay={0.05}>
        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-mono font-semibold transition-colors ${
                    i <= step
                      ? "bg-accent text-white"
                      : "border border-border text-text-3"
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className={`text-[12px] font-medium transition-colors ${
                    i <= step ? "text-text-1" : "text-text-3"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="h-px flex-1 bg-border">
                  <div
                    className="h-px bg-accent transition-all duration-500"
                    style={{ width: i < step ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </FadeIn>

      <div className="glass min-h-[360px] p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="net"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="space-y-3"
            >
              <h2 className="font-display text-[18px] font-semibold">Select network</h2>
              <p className="text-[13px] text-text-2">
                Choose the network you&apos;ll deposit from.
              </p>
              <div className="mt-4 space-y-2.5">
                {NETWORKS.map((n) => (
                  <button
                    key={n.id}
                    disabled={!n.enabled}
                    onClick={() => setStep(1)}
                    className={`flex w-full items-center justify-between rounded-[var(--radius-md)] border p-4 text-left transition-colors ${
                      n.enabled
                        ? "border-border bg-bg-2/40 hover:border-[var(--border-bright)]"
                        : "cursor-not-allowed border-border opacity-40"
                    } ${n.id === "solana" ? "ring-1 ring-accent/40" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="grid h-9 w-9 place-items-center rounded-full font-display text-[13px] font-bold text-white"
                        style={{
                          background:
                            n.id === "solana"
                              ? "linear-gradient(135deg, var(--accent), var(--accent-2))"
                              : "var(--bg-2)",
                        }}
                      >
                        {n.name.charAt(0)}
                      </span>
                      <div>
                        <p className="text-[14px] font-medium">{n.name}</p>
                        <p className="text-[12px] text-text-2">{n.desc}</p>
                      </div>
                    </div>
                    {n.enabled && <ChevronRight size={18} className="text-text-3" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="addr"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="flex flex-col items-center text-center"
            >
              <h2 className="self-start font-display text-[18px] font-semibold">
                Your Solana address
              </h2>
              <p className="mt-1 self-start text-[13px] text-text-2">
                Send only Solana network assets to this address.
              </p>

              {address ? (
                <div className="mt-6 rounded-[var(--radius-lg)] bg-white p-4">
                  <QRCode value={address} size={184} bgColor="#ffffff" fgColor="#000000" />
                </div>
              ) : (
                <div className="mt-6 flex h-[216px] w-[216px] items-center justify-center rounded-[var(--radius-lg)] border border-border text-text-3">
                  <Wallet size={28} />
                </div>
              )}

              <button
                onClick={copy}
                className="mt-6 flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-bg-2/50 p-4 transition-colors hover:border-[var(--border-bright)]"
              >
                <div className="min-w-0 text-left">
                  <p className="caps">Wallet address</p>
                  <p className="truncate font-mono text-[13px] text-text-1">
                    {truncateAddress(address, 8, 8)}
                  </p>
                </div>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-bg-2">
                  {copied ? (
                    <Check size={16} className="text-success" />
                  ) : (
                    <Copy size={16} className="text-text-2" />
                  )}
                </span>
              </button>

              <div className="mt-5 flex w-full items-center gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="flex h-11 items-center gap-1 rounded-[var(--radius-pill)] border border-border px-4 text-[14px] text-text-2 transition-colors hover:text-text-1"
                >
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="btn-buy h-11 flex-1 rounded-[var(--radius-pill)] text-[14px] font-semibold text-white"
                >
                  I&apos;ve sent the funds
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="done"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="flex flex-col items-center py-6 text-center"
            >
              <div className="check-circle">
                <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden>
                  <circle
                    cx="42"
                    cy="42"
                    r="40"
                    fill="none"
                    stroke="var(--success)"
                    strokeOpacity="0.25"
                    strokeWidth="3"
                  />
                  <path
                    className="check-stroke"
                    d="M26 43 L38 55 L59 31"
                    fill="none"
                    stroke="var(--success)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 className="mt-5 font-display text-[20px] font-bold">
                You&apos;re all set
              </h2>
              <p className="mt-1.5 max-w-[300px] text-[13px] leading-relaxed text-text-2">
                Funds appear in your wallet once the network confirms — usually
                within a few seconds on Solana.
              </p>
              <div className="mt-7 flex items-center gap-3">
                <Link
                  href="/profile"
                  className="flex h-11 items-center rounded-[var(--radius-pill)] border border-border px-5 text-[14px] text-text-1 transition-colors hover:border-[var(--border-bright)]"
                >
                  View profile
                </Link>
                <Link
                  href="/"
                  className="btn-buy flex h-11 items-center rounded-[var(--radius-pill)] px-5 text-[14px] font-semibold text-white"
                >
                  Start trading
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
