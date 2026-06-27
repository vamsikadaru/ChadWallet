"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { AnimatePresence, motion } from "framer-motion";
import { Search, LogOut, Copy, Check, Eye, EyeOff, User, Activity, ArrowDownToLine } from "lucide-react";
import { useSolanaWallet } from "@/lib/solana";
import { handleFromAddress, avatarGradient, monogram } from "@/lib/handle";
import { truncateAddress, compact } from "@/lib/format";
import { usePortfolio } from "@/lib/usePortfolio";
import Logo from "./Logo";
import DepositModal from "./DepositModal";

export default function AppHeader() {
  const { user, logout } = usePrivy();
  const { address } = useSolanaWallet();
  const { netWorth } = usePortfolio();
  const [menuOpen, setMenuOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [blur, setBlur] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("blur-balances") === "1"
  );
  const menuRef = useRef<HTMLDivElement>(null);

  const handle = handleFromAddress(address);
  const label = user?.google?.email ?? user?.email?.address ?? handle;

  useEffect(() => {
    document.documentElement.classList.toggle("blur-balances", blur);
  }, [blur]);

  const toggleBlur = () => {
    const next = !blur;
    setBlur(next);
    localStorage.setItem("blur-balances", next ? "1" : "0");
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
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

  const openSearch = () => window.dispatchEvent(new Event("open-search"));

  return (
    <>
    <header className="flex shrink-0 items-center gap-3 px-1 py-1">
      {/* Logo */}
      <div className="shrink-0 px-1">
        <Logo />
      </div>

      {/* Search bar trigger (center) */}
      <div className="relative mx-auto w-full max-w-[400px]">
        <button
          onClick={openSearch}
          className="flex h-10 w-full items-center gap-2 rounded-xl border border-bg-tertiary bg-bg-primary px-3 text-sm hover:bg-bg-secondary cursor-text"
        >
          <Search size={15} className="shrink-0 text-text-tertiary" />
          <span className="min-w-0 flex-1 text-left text-text-tertiary">
            Search for tokens or traders...
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="rounded-sm bg-bg-tertiary px-1.5 py-0.5 text-[10px] font-bold text-text-secondary">
              Paste
            </span>
            <span className="min-w-5 rounded-sm bg-bg-tertiary px-1.5 py-0.5 text-center text-[10px] font-bold text-text-secondary">
              /
            </span>
          </div>
        </button>
      </div>

      {/* Right: cash balance + avatar menu */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Cash / deposit — desktop only */}
        <div className="hidden items-end gap-0 rounded-xl border border-bg-tertiary px-3 py-1.5 xl:flex xl:flex-col">
          <span className="balance-sensitive font-mono text-sm tabular-nums text-text-primary">
            ${netWorth > 0 ? netWorth.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "0.00"}{" "}
            <span className="text-xs text-text-secondary">cash</span>
          </span>
          <button
            onClick={() => setDepositOpen(true)}
            className="text-xs font-bold text-accent-primary hover:opacity-80"
          >
            Deposit more
          </button>
        </div>

        {/* Portfolio + avatar dropdown */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-bg-tertiary bg-bg-primary px-2.5 py-1.5 hover:bg-bg-secondary"
          >
            <div className="flex flex-col items-start">
              <span className="balance-sensitive font-mono text-sm tabular-nums text-text-primary">
                ${compact(netWorth)}
              </span>
              <span className="font-mono text-[11px] text-text-secondary">--</span>
            </div>
            <div
              className="flex shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
              style={{ height: 32, width: 32, background: avatarGradient(address) }}
            >
              {monogram(label)}
            </div>
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.14 }}
                className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-bg-tertiary bg-bg-secondary p-1"
              >
                {/* Identity */}
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <div
                    className="grid shrink-0 place-items-center rounded-full text-[13px] font-bold text-white"
                    style={{ height: 36, width: 36, background: avatarGradient(address) }}
                  >
                    {monogram(label)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-text-primary">
                      {handle}
                    </p>
                    <button
                      onClick={copy}
                      className="flex items-center gap-1 font-mono text-[11px] text-text-secondary hover:text-text-primary"
                    >
                      {truncateAddress(address, 4, 4)}
                      {copied ? (
                        <Check size={10} className="text-green" />
                      ) : (
                        <Copy size={10} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="my-1 h-px bg-bg-tertiary" />

                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-text-primary transition-colors hover:bg-bg-tertiary"
                >
                  <User size={14} /> Profile
                </Link>
                <Link
                  href="/activity"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-text-primary transition-colors hover:bg-bg-tertiary"
                >
                  <Activity size={14} /> Activity
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); setDepositOpen(true); }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-text-primary transition-colors hover:bg-bg-tertiary"
                >
                  <ArrowDownToLine size={14} /> Deposit
                </button>
                <button
                  onClick={toggleBlur}
                  className="flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-[13px] text-text-primary transition-colors hover:bg-bg-tertiary"
                >
                  <span className="flex items-center gap-2.5">
                    {blur ? <EyeOff size={14} /> : <Eye size={14} />} Blur balances
                  </span>
                  <span
                    className={`relative h-4 w-7 rounded-full transition-colors ${
                      blur ? "bg-accent-primary" : "bg-bg-tertiary-solid"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${
                        blur ? "left-3.5" : "left-0.5"
                      }`}
                    />
                  </span>
                </button>

                <div className="my-1 h-px bg-bg-tertiary" />

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-red transition-colors hover:bg-red-transparent"
                >
                  <LogOut size={14} /> Log out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>

    <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} />
    </>
  );
}

