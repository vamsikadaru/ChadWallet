"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { AnimatePresence, motion } from "framer-motion";
import { User, Eye, EyeOff, LogOut, Copy, Check } from "lucide-react";
import { useSolanaWallet } from "@/lib/solana";
import { handleFromAddress, avatarGradient, monogram } from "@/lib/handle";
import { truncateAddress } from "@/lib/format";

export default function UserMenu() {
  const { user, logout } = usePrivy();
  const { address } = useSolanaWallet();
  const [open, setOpen] = useState(false);
  const [blur, setBlur] = useState<boolean>(
    () => typeof window !== "undefined" && localStorage.getItem("blur-balances") === "1"
  );
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handle = handleFromAddress(address);
  const label = user?.google?.email ?? user?.email?.address ?? handle;

  // Reflect the "blur balances" preference on <html> whenever it changes.
  useEffect(() => {
    document.documentElement.classList.toggle("blur-balances", blur);
  }, [blur]);

  const toggleBlur = () => {
    const next = !blur;
    setBlur(next);
    localStorage.setItem("blur-balances", next ? "1" : "0");
  };

  // Close on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const copy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div ref={ref} className="fixed right-6 top-5 z-50 hidden lg:block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="grid h-10 w-10 place-items-center rounded-full text-[14px] font-bold text-white ring-2 ring-bg-1 transition-transform hover:scale-105"
        style={{ background: avatarGradient(address) }}
        aria-label="Account menu"
      >
        {monogram(label)}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="glass absolute right-0 mt-2 w-60 overflow-hidden p-1.5"
          >
            <div className="flex items-center gap-3 px-3 py-2.5">
              <div
                className="grid h-9 w-9 place-items-center rounded-full text-[13px] font-bold text-white"
                style={{ background: avatarGradient(address) }}
              >
                {monogram(label)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold">{handle}</p>
                <button
                  onClick={copy}
                  className="flex items-center gap-1 font-mono text-[11px] text-text-2 hover:text-text-1"
                >
                  {truncateAddress(address, 4, 4)}
                  {copied ? (
                    <Check size={10} className="text-success" />
                  ) : (
                    <Copy size={10} />
                  )}
                </button>
              </div>
            </div>

            <div className="my-1 h-px bg-border" />

            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-[13px] text-text-1 transition-colors hover:bg-bg-2/60"
            >
              <User size={15} /> Your profile
            </Link>
            <button
              onClick={toggleBlur}
              className="flex w-full items-center justify-between gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-[13px] text-text-1 transition-colors hover:bg-bg-2/60"
            >
              <span className="flex items-center gap-2.5">
                {blur ? <EyeOff size={15} /> : <Eye size={15} />} Blur balances
              </span>
              <span
                className={`relative h-4 w-7 rounded-full transition-colors ${
                  blur ? "bg-accent" : "bg-bg-2"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${
                    blur ? "left-3.5" : "left-0.5"
                  }`}
                />
              </span>
            </button>

            <div className="my-1 h-px bg-border" />

            <button
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-[13px] text-danger transition-colors hover:bg-danger/10"
            >
              <LogOut size={15} /> Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
