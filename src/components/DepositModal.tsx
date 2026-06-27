"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Copy, Check, ChevronRight, ChevronLeft, Wallet } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useSolanaWallet } from "@/lib/solana";
import QRCode from "react-qr-code";
import { truncateAddress } from "@/lib/format";

const NETWORKS = [
  { id: "solana", name: "Solana", desc: "SOL & SPL tokens", enabled: true },
  { id: "eth",    name: "Ethereum", desc: "Coming soon",    enabled: false },
  { id: "base",   name: "Base",     desc: "Coming soon",    enabled: false },
];

export default function DepositModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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

  const handleClose = () => { setStep(0); onClose(); };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          {/* Backdrop — subtle blur, does NOT make the chart black */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={handleClose}
          />

          {/* Modal panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-bg-tertiary bg-bg-secondary shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-bg-tertiary px-6 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  Add funds
                </p>
                <h2 className="mt-0.5 text-[18px] font-semibold text-text-primary">Deposit</h2>
              </div>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-bg-tertiary text-text-secondary transition-colors hover:text-text-primary"
              >
                <X size={16} />
              </button>
            </div>

            {/* Step dots */}
            <div className="flex items-center gap-1.5 px-6 pt-4">
              {["Network", "Address", "Done"].map((label, i) => (
                <div key={label} className="flex flex-1 items-center gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors"
                      style={
                        i <= step
                          ? { background: "var(--accent-primary)", color: "#fff" }
                          : { border: "1px solid var(--bg-tertiary-solid)", color: "var(--text-tertiary)" }
                      }
                    >
                      {i + 1}
                    </span>
                    <span
                      className="text-[11px] font-medium transition-colors"
                      style={{ color: i <= step ? "var(--text-primary)" : "var(--text-tertiary)" }}
                    >
                      {label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className="h-px flex-1 bg-bg-tertiary">
                      <div
                        className="h-px transition-all duration-500"
                        style={{ width: i < step ? "100%" : "0%", background: "var(--accent-primary)" }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Step content */}
            <div className="min-h-[320px] p-6">
              <AnimatePresence mode="wait">
                {step === 0 && (
                  <motion.div
                    key="net"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <p className="text-[13px] text-text-secondary">
                      Choose the network you'll deposit from.
                    </p>
                    <div className="mt-3 space-y-2">
                      {NETWORKS.map((n) => (
                        <button
                          key={n.id}
                          disabled={!n.enabled}
                          onClick={() => setStep(1)}
                          className="flex w-full items-center justify-between rounded-xl border border-bg-tertiary bg-bg-primary p-4 text-left transition-colors enabled:hover:border-text-tertiary disabled:cursor-not-allowed disabled:opacity-40"
                          style={n.id === "solana" ? { borderColor: "var(--accent-primary)" } : {}}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold text-white"
                              style={{
                                background: n.id === "solana"
                                  ? "linear-gradient(135deg,var(--accent-primary),#14F195)"
                                  : "var(--bg-tertiary-solid)",
                              }}
                            >
                              {n.name.charAt(0)}
                            </span>
                            <div>
                              <p className="text-[14px] font-medium text-text-primary">{n.name}</p>
                              <p className="text-[12px] text-text-secondary">{n.desc}</p>
                            </div>
                          </div>
                          {n.enabled && <ChevronRight size={16} className="text-text-tertiary" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 1 && (
                  <motion.div
                    key="addr"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center text-center"
                  >
                    <p className="self-start text-[13px] text-text-secondary">
                      Send only Solana network assets to this address.
                    </p>
                    {address ? (
                      <div className="mt-5 rounded-xl bg-white p-3">
                        <QRCode value={address} size={160} bgColor="#ffffff" fgColor="#000000" />
                      </div>
                    ) : (
                      <div className="mt-5 flex h-44 w-44 items-center justify-center rounded-xl border border-bg-tertiary text-text-tertiary">
                        <Wallet size={24} />
                      </div>
                    )}
                    <button
                      onClick={copy}
                      className="mt-5 flex w-full items-center justify-between rounded-xl border border-bg-tertiary bg-bg-primary p-4 transition-colors hover:border-text-tertiary"
                    >
                      <div className="min-w-0 text-left">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                          Wallet address
                        </p>
                        <p className="mt-0.5 truncate font-mono text-[13px] text-text-primary">
                          {truncateAddress(address, 8, 8)}
                        </p>
                      </div>
                      <span className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-tertiary">
                        {copied
                          ? <Check size={14} className="text-green" />
                          : <Copy size={14} className="text-text-secondary" />
                        }
                      </span>
                    </button>
                    <div className="mt-4 flex w-full items-center gap-2">
                      <button
                        onClick={() => setStep(0)}
                        className="flex h-10 items-center gap-1 rounded-full border border-bg-tertiary px-4 text-[13px] text-text-secondary transition-colors hover:text-text-primary"
                      >
                        <ChevronLeft size={14} /> Back
                      </button>
                      <button
                        onClick={() => setStep(2)}
                        className="btn-buy h-10 flex-1 rounded-full text-[13px] font-semibold text-white"
                      >
                        I've sent the funds
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center py-6 text-center"
                  >
                    <svg width="72" height="72" viewBox="0 0 84 84" aria-hidden>
                      <circle cx="42" cy="42" r="40" fill="none" stroke="var(--success)" strokeOpacity="0.25" strokeWidth="3" />
                      <path d="M26 43 L38 55 L59 31" fill="none" stroke="var(--success)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="check-stroke" />
                    </svg>
                    <h3 className="mt-4 text-[18px] font-semibold text-text-primary">You're all set</h3>
                    <p className="mt-2 max-w-[260px] text-[13px] leading-relaxed text-text-secondary">
                      Funds appear once the network confirms — usually within seconds on Solana.
                    </p>
                    <button
                      onClick={handleClose}
                      className="btn-buy mt-6 h-10 w-full rounded-full text-[14px] font-semibold text-white"
                    >
                      Start trading
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
