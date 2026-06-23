"use client";

import { useEffect, useState } from "react";
import { useLogin } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Zap,
  LineChart,
  Wallet,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Logo from "./Logo";
import TokenLogo from "./ui/TokenLogo";
import PriceBadge from "./ui/PriceBadge";
import { EASE } from "./ui/motion";
import { getTrendingTokens } from "@/lib/birdeye";
import { formatPrice } from "@/lib/format";
import type { Token } from "@/lib/types";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Non-custodial by default",
    body: "Sign in with Google, Apple or email and a Solana wallet is created just for you. Your keys never leave your control.",
  },
  {
    icon: LineChart,
    title: "Live market data",
    body: "Trending tokens, prices, and charts stream in real time from on-chain data — no stale numbers, no guesswork.",
  },
  {
    icon: Zap,
    title: "One-tap trading",
    body: "Spot a mover and ape in instantly. Buy and sell trending Solana tokens with a single confirmation.",
  },
  {
    icon: Wallet,
    title: "Your portfolio, live",
    body: "Net worth, holdings, and 24h moves are priced from your real wallet balances the moment you fund it.",
  },
];

export default function Landing() {
  const { login } = useLogin();
  const [tokens, setTokens] = useState<Token[]>([]);

  useEffect(() => {
    let active = true;
    getTrendingTokens().then((t) => {
      if (active) setTokens(t.slice(0, 10));
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient gradient orbs */}
      <div className="orb h-[460px] w-[460px]" style={{ top: "-6%", left: "8%" }} />
      <div
        className="orb h-[380px] w-[380px]"
        style={{ top: "30%", right: "6%", animationDelay: "-6s", opacity: 0.35 }}
      />
      <div className="pointer-events-none absolute inset-0 bg-bg-0/30" />

      {/* Nav */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-[14px] text-text-2 transition-colors hover:text-text-1">
            Features
          </a>
          <a href="#markets" className="text-[14px] text-text-2 transition-colors hover:text-text-1">
            Markets
          </a>
        </nav>
        <button
          onClick={login}
          className="flex h-10 items-center gap-2 rounded-[var(--radius-pill)] border border-border bg-bg-1 px-4 text-[13px] font-semibold text-text-1 transition-colors hover:border-[var(--border-bright)]"
        >
          Sign in
        </button>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-5 pb-12 pt-12 text-center sm:px-8 sm:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mb-6 inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-border bg-bg-1/70 px-3.5 py-1.5"
        >
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-success" />
          <span className="caps">Live on Solana mainnet</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.05 }}
          className="font-display text-[clamp(38px,8vw,76px)] font-extrabold leading-[1.02] tracking-tight"
        >
          Trade Solana
          <br />
          like a{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(100deg, var(--accent), var(--accent-2))",
            }}
          >
            Chad
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.1 }}
          className="mt-5 max-w-[540px] text-[15px] leading-relaxed text-text-2 sm:text-[17px]"
        >
          A premium, non-custodial wallet for trading trending Solana tokens.
          Sign in, get a wallet in seconds, and trade live markets with zero
          friction.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.15 }}
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
        >
          <button
            onClick={login}
            className="btn-buy flex h-12 items-center justify-center gap-2 rounded-[var(--radius-pill)] px-7 text-[15px] font-bold text-white transition-[filter]"
          >
            Launch App <ArrowRight size={17} />
          </button>
          <a
            href="#features"
            className="flex h-12 items-center justify-center gap-2 rounded-[var(--radius-pill)] border border-border bg-bg-1 px-7 text-[15px] font-medium text-text-1 transition-colors hover:border-[var(--border-bright)]"
          >
            <Sparkles size={16} className="text-accent" /> See what&apos;s inside
          </a>
        </motion.div>
      </section>

      {/* Live trending ticker */}
      <section id="markets" className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8">
        <div className="mb-3 flex items-center gap-2">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-success" />
          <span className="caps">Trending right now — live</span>
        </div>
        <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
          {(tokens.length ? tokens : Array.from({ length: 6 })).map((t, i) => {
            const token = t as Token | undefined;
            return (
              <div
                key={token?.address ?? i}
                className="glass flex min-w-[180px] shrink-0 items-center gap-3 p-3.5"
              >
                {token ? (
                  <>
                    <TokenLogo src={token.logoURI} symbol={token.symbol} size={32} />
                    <div className="min-w-0">
                      <p className="font-display text-[14px] font-bold leading-tight">
                        {token.symbol}
                      </p>
                      <p className="font-mono text-[12px] text-text-2">
                        {formatPrice(token.price)}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <PriceBadge value={token.priceChange24h} showArrow={false} />
                    </div>
                  </>
                ) : (
                  <div className="h-8 w-full animate-pulse rounded bg-bg-2/50" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8"
      >
        <h2 className="font-display text-[clamp(26px,4vw,38px)] font-bold tracking-tight">
          Everything you need to{" "}
          <span className="text-accent">degen responsibly</span>
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.45, ease: EASE, delay: (i % 2) * 0.05 }}
                className="glass p-6"
              >
                <div
                  className="grid h-11 w-11 place-items-center rounded-[var(--radius-md)]"
                  style={{ background: "rgba(153,69,255,0.12)", color: "var(--accent)" }}
                >
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 font-display text-[18px] font-bold">{f.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-text-2">{f.body}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8">
        <div className="glass flex flex-col items-center gap-5 p-10 text-center sm:p-14">
          <h2 className="font-display text-[clamp(26px,4vw,40px)] font-bold tracking-tight">
            Your wallet is one tap away
          </h2>
          <p className="max-w-[440px] text-[15px] text-text-2">
            No seed phrases to write down. No extensions to install. Just sign in
            and start trading.
          </p>
          <button
            onClick={login}
            className="btn-buy flex h-12 items-center justify-center gap-2 rounded-[var(--radius-pill)] px-8 text-[15px] font-bold text-white"
          >
            Continue with Google <ArrowRight size={17} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-5 py-7 text-center sm:flex-row sm:px-8 sm:text-left">
          <Logo />
          <p className="text-[12px] text-text-3">
            © {new Date().getFullYear()} ChadWallet · Non-custodial · Solana
            mainnet · Not financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
