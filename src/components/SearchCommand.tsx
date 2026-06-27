"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, ArrowRight } from "lucide-react";
import TokenLogo from "./ui/TokenLogo";
import PriceBadge from "./ui/PriceBadge";
import { getTrendingTokens, searchTokens } from "@/lib/birdeye";
import { formatPrice } from "@/lib/format";
import type { Token } from "@/lib/types";

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/** Spotlight-style search over live tokens. Opens with the search button or "/". */
export default function SearchCommand() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [searchResults, setSearchResults] = useState<Token[]>([]);
  const [searching, setSearching] = useState(false);

  // Load the trending universe once when first opened (shown when query empty).
  useEffect(() => {
    if (open && tokens.length === 0) {
      getTrendingTokens().then(setTokens);
    }
  }, [open, tokens.length]);

  // Debounced live search across ALL Solana tokens — not just trending.
  // All state updates run in deferred callbacks (no sync setState in effects).
  useEffect(() => {
    const term = q.trim();
    if (!term || BASE58.test(term)) {
      const id = setTimeout(() => {
        setSearchResults([]);
        setSearching(false);
      }, 0);
      return () => clearTimeout(id);
    }
    const id = setTimeout(async () => {
      setSearching(true);
      const hits = await searchTokens(term);
      setSearchResults(hits);
      setSearching(false);
    }, 250);
    return () => clearTimeout(id);
  }, [q]);

  // Keyboard: "/" opens, Esc closes. Custom event "open-search" also opens.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
      if (e.key === "/" && !typing && !open) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onCustom = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-search", onCustom);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-search", onCustom);
    };
  }, [open]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return tokens.slice(0, 8);
    if (searchResults.length) return searchResults.slice(0, 8);
    // Fallback: filter the loaded trending list if the API search is empty.
    return tokens
      .filter(
        (t) =>
          t.symbol.toLowerCase().includes(term) ||
          t.name.toLowerCase().includes(term)
      )
      .slice(0, 8);
  }, [q, tokens, searchResults]);

  const go = (address: string) => {
    setOpen(false);
    setQ("");
    router.push(`/trade/${address}`);
  };

  const isAddress = BASE58.test(q.trim());

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2.5 rounded-[var(--radius-md)] border border-border bg-bg-1 px-3 py-2 text-[13px] text-text-3 transition-colors hover:border-[var(--border-bright)]"
      >
        <Search size={15} />
        <span className="flex-1 text-left">Search tokens…</span>
        <kbd className="rounded border border-border bg-bg-2 px-1.5 py-0.5 font-mono text-[10px]">
          /
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="glass relative z-10 w-full max-w-lg overflow-hidden p-0"
            >
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <Search size={18} className="text-text-3" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (results[0]) go(results[0].address);
                      else if (isAddress) go(q.trim());
                    }
                  }}
                  placeholder="Search by name, symbol or mint address"
                  className="w-full bg-transparent text-[15px] text-text-1 placeholder:text-text-3 focus:outline-none"
                />
                <button onClick={() => setOpen(false)} aria-label="Close">
                  <X size={18} className="text-text-3 hover:text-text-1" />
                </button>
              </div>

              <div className="custom-scrollbar max-h-[360px] overflow-y-auto p-2">
                {results.length === 0 && isAddress && (
                  <button
                    onClick={() => go(q.trim())}
                    className="flex w-full items-center justify-between rounded-[var(--radius-md)] px-3 py-3 text-left transition-colors hover:bg-bg-2/50"
                  >
                    <span className="font-mono text-[13px] text-text-1">
                      Open token {q.trim().slice(0, 6)}…{q.trim().slice(-4)}
                    </span>
                    <ArrowRight size={16} className="text-accent" />
                  </button>
                )}
                {searching && results.length === 0 && !isAddress && (
                  <p className="px-3 py-8 text-center text-[13px] text-text-3">
                    Searching…
                  </p>
                )}
                {!searching && results.length === 0 && !isAddress && q.trim() && (
                  <p className="px-3 py-8 text-center text-[13px] text-text-3">
                    No tokens match “{q}”.
                  </p>
                )}
                {results.map((t) => (
                  <button
                    key={t.address}
                    onClick={() => go(t.address)}
                    className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left transition-colors hover:bg-bg-2/50"
                  >
                    <TokenLogo
                      src={t.logoURI}
                      symbol={t.symbol}
                      size={32}
                      className="shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold">{t.name}</p>
                      <p className="font-mono text-[11px] text-text-2">{t.symbol}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                      <span className="font-mono text-[13px]">
                        {formatPrice(t.price)}
                      </span>
                      <PriceBadge value={t.priceChange24h} showArrow={false} />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
