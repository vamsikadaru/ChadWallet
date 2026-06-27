"use client";

import { useLogin } from "@privy-io/react-auth";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

/* ─── Gradient text helper ─────────────────────────────────────────── */

function G({ children }: { children: React.ReactNode }) {
  return <span className="text-gradient">{children}</span>;
}

/* ─── Logo diamond ─────────────────────────────────────────────────── */

function LogoDiamond({ size, uid = "0" }: { size: number; uid?: string }) {
  const g = `ldG${uid}`, c = `ldC${uid}`, k = `ldK${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id={g} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9945FF" />
          <stop offset="55%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#14F195" />
        </linearGradient>
        <linearGradient id={c} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14F195" />
          <stop offset="100%" stopColor="#9945FF" />
        </linearGradient>
        <clipPath id={k}><rect width="280" height="280" rx="56" /></clipPath>
      </defs>
      <g clipPath={`url(#${k})`}>
        <rect width="280" height="280" fill="#0B0B12" />
        <g transform="translate(140,140)">
          <path d="M -78 -10 L -10 -78 L 78 10 L 10 78 Z" fill={`url(#${g})`} />
          <path d="M -44 0 L 0 -44 L 44 0 L 0 44 Z" fill="#0B0B12" />
          <rect x="-9" y="-9" width="18" height="18" rx="4" fill={`url(#${c})`} />
        </g>
      </g>
    </svg>
  );
}


/* ─── CTA buttons ───────────────────────────────────────────────────── */

function LaunchBtn({ onClick, label = "Launch App" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[15px] font-semibold text-white transition-all duration-200 hover:brightness-110"
      style={{ background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)" }}
    >
      {label}
      <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
    </button>
  );
}

function InsideBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/6 px-6 py-3 text-[15px] font-semibold text-white/80 backdrop-blur-sm transition-all duration-200 hover:border-white/25 hover:bg-white/12 hover:text-white"
    >
      <Sparkles size={14} className="text-white/50" />
      See what&apos;s inside
    </button>
  );
}

/* ─── Feature cards ─────────────────────────────────────────────────── */

function FeatureCard({ tag, heading, children }: { tag: string; heading: string; children: React.ReactNode }) {
  return (
    <div className="group relative flex aspect-[5/4] flex-1 cursor-pointer flex-col overflow-hidden rounded-[22px] border border-white/8 bg-bg-secondary transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-accent-primary/40 hover:shadow-[0_24px_64px_-8px_rgba(153,69,255,0.22)]">
      <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(153,69,255,0.13) 0%, transparent 60%)" }} />
      <div className="relative shrink-0 px-6 pb-2 pt-6">
        <p className="mb-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-accent-primary">{tag}</p>
        <h3 className="font-display text-[28px] font-bold leading-[1.1] tracking-tight text-white desktop:text-[34px]">{heading}</h3>
      </div>
      <div className="relative flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

function LeaderboardVisual() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-x-4 bottom-2 top-1">
        <Image src="/images/leaderboard.webp" alt="Leaderboard" fill
          className="object-contain object-bottom transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          sizes="(max-width: 800px) 90vw, 30vw" />
      </div>
    </div>
  );
}

function FeedVisual() {
  const trades = [
    { user: "0xCH4D", action: "bought", token: "BONK", amount: "$2,400", time: "2s ago", up: true },
    { user: "degen.sol", action: "sold", token: "WIF", amount: "$890", time: "8s ago", up: false },
    { user: "moonbag.sol", action: "bought", token: "POPCAT", amount: "$5,100", time: "14s ago", up: true },
    { user: "alphachad", action: "bought", token: "MEW", amount: "$3,200", time: "21s ago", up: true },
    { user: "whale42.sol", action: "sold", token: "BONK", amount: "$12k", time: "35s ago", up: false },
  ];
  return (
    <div className="flex h-full flex-col gap-0.5 overflow-hidden px-4 pb-4">
      {trades.map((t, i) => (
        <div key={i} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/4">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-primary/20 text-[11px] font-bold text-accent-primary">
            {t.user[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-white">{t.user}</p>
            <p className="text-[10px] text-white/40">{t.action} <span className="text-white/70">{t.token}</span></p>
          </div>
          <div className="text-right">
            <p className={`text-[11px] font-bold ${t.up ? "text-green" : "text-red"}`}>{t.amount}</p>
            <p className="text-[9px] text-white/30">{t.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AlertsVisual() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute -inset-x-2 bottom-0 top-0">
        <Image src="/images/alerts.webp" alt="Price alerts" fill
          className="object-contain object-bottom transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          sizes="(max-width: 800px) 90vw, 30vw" />
      </div>
    </div>
  );
}

function OnboardingVisual() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-x-4 bottom-2 top-1">
        <Image src="/images/sign-in.webp" alt="Sign in" fill
          className="object-contain object-bottom transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          sizes="(max-width: 800px) 90vw, 30vw" />
      </div>
    </div>
  );
}

function SpeedVisual() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 pb-6">
      <div className="w-full rounded-2xl border border-white/8 bg-white/4 p-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/40">Transaction</p>
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-bold text-white">SOL → USDC</span>
          <span className="rounded-full bg-green/15 px-2.5 py-1 text-[10px] font-bold text-green">Confirmed</span>
        </div>
        <div className="mt-3 flex gap-2">
          {["Gas fee", "Network"].map((label, i) => (
            <div key={i} className="flex-1 rounded-xl bg-white/5 p-2.5 text-center">
              <p className="text-[9px] text-white/40">{label}</p>
              <p className="mt-0.5 text-[13px] font-bold text-white">{i === 0 ? "$0.00" : "Solana"}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex w-full items-center gap-2 rounded-xl border border-green/20 bg-green/8 px-3 py-2.5">
        <div className="h-1.5 w-1.5 rounded-full bg-green" />
        <p className="text-[11px] font-semibold text-green">Zero gas fees, always</p>
      </div>
    </div>
  );
}

function DepositVisual() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-x-4 bottom-2 top-1">
        <Image src="/images/apple-pay.webp" alt="Apple Pay" fill
          className="object-contain object-bottom transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          sizes="(max-width: 800px) 90vw, 30vw" />
      </div>
    </div>
  );
}

/* ─── Landing ───────────────────────────────────────────────────────── */

export default function Landing() {
  const { login } = useLogin();

  return (
    <div className="relative isolate flex min-h-svh flex-col overflow-x-hidden bg-[#09090f]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>

      {/* ════════════════════════════════════
          HERO
          ════════════════════════════════════ */}
      <section className="relative flex min-h-svh flex-col overflow-hidden">

        {/* Background: space image + dual glow */}
        <div className="absolute inset-0 -z-10">
          <Image src="/images/space-bg.webp" alt="" fill className="object-cover object-top opacity-30" priority />
          {/* Teal glow — top-left, matches reference */}
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 15% 0%, rgba(20,241,149,0.18) 0%, transparent 48%)" }} />
          {/* Purple glow — top-center */}
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 60% 0%, rgba(120,60,240,0.35) 0%, transparent 45%)" }} />
          {/* Base dark scrim */}
          <div className="absolute inset-0 bg-[#09090f]/70" />
        </div>

        {/* ── Header ── */}
        <header className="relative z-20 flex items-center justify-between px-6 py-5 desktop:px-12">
          {/* Wordmark: Chad white-bold / Wallet lighter */}
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="ChadWallet home">
            <LogoDiamond size={28} uid="h" />
            <span style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }} className="text-[15px]">
              <span className="font-bold text-white">Chad</span><span className="font-medium text-white/60">Wallet</span>
            </span>
          </Link>

          {/* Nav links — desktop only */}
          <nav className="hidden items-center gap-8 desktop:flex">
            <a href="#features" className="text-[14px] font-medium text-white/55 transition-colors hover:text-white">Features</a>
            <a href="#markets" className="text-[14px] font-medium text-white/55 transition-colors hover:text-white">Markets</a>
          </nav>

          {/* Sign in */}
          <button
            onClick={login}
            className="rounded-xl border border-white/15 bg-white/8 px-5 py-2 text-[13px] font-semibold text-white/80 backdrop-blur-sm transition-all duration-200 hover:border-white/25 hover:bg-white/14 hover:text-white"
          >
            Sign in
          </button>
        </header>

        {/* ── Hero content ── */}
        <div className="relative z-10 flex flex-1 flex-col items-center px-6 pt-14 text-center desktop:pt-20">

          {/* Live pill */}
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-green/25 bg-green/8 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-green">Live on Solana Mainnet</span>
          </div>

          {/* Main headline — Syne 800, very large, tight */}
          <h1
            className="font-display font-bold tracking-tight"
            style={{ fontSize: "clamp(48px, 8.5vw, 112px)", lineHeight: 0.97, letterSpacing: "-0.02em" }}
          >
            <span className="text-white">Trade Solana</span>
            <br />
            <span className="text-white">like a </span>
            <G>Chad</G>
          </h1>

          {/* Sub-heading */}
          <p
            className="mt-6 max-w-[500px] text-white/55"
            style={{ fontSize: "clamp(14px, 1.3vw, 17px)", lineHeight: 1.7 }}
          >
            A premium, non-custodial wallet for trading trending Solana tokens. Sign in, get a wallet in seconds, and trade live markets with zero friction.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <LaunchBtn onClick={login} />
            <InsideBtn onClick={login} />
          </div>

          {/* Astronaut */}
          <div
            className="mt-10 animate-[float_5s_ease-in-out_infinite]"
            style={{ width: "clamp(220px, 40vw, 540px)" }}
          >
            <Image
              src="/images/astronaut.webp"
              alt="Astronaut trading in space"
              width={900}
              height={900}
              className="h-auto w-full object-contain"
              priority
            />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 -z-10 bg-gradient-to-t from-[#09090f]" />
      </section>

      {/* ════════════════════════════════════
          TRADE FROM ANYWHERE
          ════════════════════════════════════ */}
      <section className="flex flex-col items-center px-6 py-20 text-center desktop:py-28">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-accent-primary">
          Web · iOS · Android
        </p>
        <h2
          className="mt-5 font-display font-bold tracking-tight"
          style={{ fontSize: "clamp(28px, 4.8vw, 60px)", lineHeight: 1.08, letterSpacing: "-0.02em" }}
        >
          <span className="text-white">your edge travels</span>
          <br />
          <G>with you.</G>
        </h2>
        <p
          className="mt-5 max-w-[460px] text-white/50"
          style={{ fontSize: "clamp(14px, 1.2vw, 16px)", lineHeight: 1.75 }}
        >
          Start a position on your phone, monitor it at your desk. One wallet, every device — your trades always in your pocket.
        </p>

        {/* Device showcase */}
        <div className="relative mt-12 w-full max-w-5xl">
          {/* Ambient glow */}
          <div
            className="pointer-events-none absolute inset-x-[5%] bottom-0 h-1/3 blur-[80px]"
            style={{ background: "radial-gradient(ellipse at center, rgba(100,60,240,0.35) 0%, transparent 80%)" }}
          />

          {/* ── Desktop monitor ── */}
          <div className="relative mx-auto w-full">
            {/* Bezel */}
            <div className="relative rounded-[14px] border border-white/10 bg-[#1a1a24] p-[10px] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_40px_80px_-20px_rgba(0,0,0,0.8)]">
              {/* Camera dot */}
              <div className="absolute top-0 left-1/2 z-10 -translate-x-1/2">
                <div className="h-[6px] w-[6px] rounded-full bg-[#2a2a38]" />
              </div>
              {/* Screen */}
              <div className="relative overflow-hidden rounded-[6px] bg-[#09090f]" style={{ aspectRatio: "16/10" }}>
                <Image
                  src="/images/screenshot-desktop.png"
                  alt="ChadWallet desktop app"
                  width={2940}
                  height={1912}
                  className="h-full w-full object-cover object-top"
                  sizes="(max-width: 800px) 95vw, 900px"
                />
              </div>
            </div>
            {/* Stand neck */}
            <div className="mx-auto h-[28px] w-[6%] bg-gradient-to-b from-[#1a1a24] to-[#141420]" />
            {/* Base */}
            <div className="mx-auto h-[8px] w-[28%] rounded-full bg-[#1a1a24] shadow-[0_4px_20px_rgba(0,0,0,0.5)]" />
          </div>

          {/* ── Phone — floats bottom-right ── */}
          <div
            className="absolute bottom-[4%] right-[-2%] z-10 w-[22%] desktop:w-[20%]"
            style={{ animation: "phone-float 5s ease-in-out infinite" }}
          >
            {/* Glow */}
            <div
              className="pointer-events-none absolute inset-0 blur-[30px] scale-75"
              style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(153,69,255,0.5) 0%, transparent 75%)" }}
            />
            {/* Phone bezel */}
            <div className="relative rounded-[36px] border border-white/10 bg-[#1a1a24] p-[8px] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_32px_64px_-8px_rgba(0,0,0,0.9)]">
              {/* Dynamic island */}
              <div className="absolute left-1/2 top-[10px] z-10 -translate-x-1/2">
                <div className="h-[14px] w-[52px] rounded-full bg-[#0e0e16]" />
              </div>
              {/* Screen */}
              <div className="relative overflow-hidden rounded-[28px] bg-[#09090f]" style={{ aspectRatio: "9/19.5" }}>
                <Image
                  src="/images/screenshot-phone.png"
                  alt="ChadWallet mobile app"
                  width={1080}
                  height={2404}
                  className="h-full w-full object-cover object-top"
                  sizes="(max-width: 800px) 25vw, 220px"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-20 mx-auto w-full max-w-[1380px] px-4 py-16 desktop:px-10 desktop:py-24">
        <div className="mb-10 text-center">
          <h2 className="font-display font-bold tracking-tight"
              style={{ fontSize: "clamp(28px, 4.5vw, 58px)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            <span className="text-white">everything you need to </span><G>degen responsibly</G>
          </h2>
        </div>
        <div className="flex flex-col gap-4 desktop:gap-5">
          <div className="flex flex-col gap-4 desktop:flex-row desktop:gap-5">
            <FeatureCard tag="Leaderboard" heading="become a legend, top the leaderboard"><LeaderboardVisual /></FeatureCard>
            <FeatureCard tag="Feed" heading="discover and follow top traders"><FeedVisual /></FeatureCard>
            <FeatureCard tag="Alerts" heading="real time notifications for what the best are buying"><AlertsVisual /></FeatureCard>
          </div>
          <div className="flex flex-col gap-4 desktop:flex-row desktop:gap-5">
            <FeatureCard tag="Easy Onboarding" heading="create an account in an instant"><OnboardingVisual /></FeatureCard>
            <FeatureCard tag="Zero Complexity" heading="multichain & gasless"><SpeedVisual /></FeatureCard>
            <FeatureCard tag="One Click to Buy" heading="fund with apple pay"><DepositVisual /></FeatureCard>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          COMMUNITY — rotating rings
          ════════════════════════════════════ */}
      <section id="markets" className="scroll-mt-20 relative flex items-center justify-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(100,60,220,0.16) 0%, transparent 65%)" }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-[#09090f]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-[#09090f]" />

        <div className="relative flex items-center justify-center" style={{ width: "min(90vw, 820px)", height: "min(90vw, 820px)" }}>
          <div className="absolute inset-0 animate-[spin_50s_linear_infinite]">
            <Image src="/images/community-outer.webp" alt="" fill className="object-contain" />
          </div>
          <div className="absolute inset-0 m-auto animate-[spin_32s_linear_infinite_reverse]" style={{ width: "60%", height: "60%" }}>
            <Image src="/images/community-inner.webp" alt="" fill className="object-contain" />
          </div>
          <div className="pointer-events-none absolute inset-0 m-auto rounded-full" style={{ width: "36%", height: "36%", background: "radial-gradient(ellipse at center, rgba(100,60,220,0.4) 0%, transparent 70%)", filter: "blur(30px)" }} />

          <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
            <h2
              className="font-display font-bold tracking-tight text-white"
              style={{ fontSize: "clamp(24px, 4vw, 52px)", lineHeight: 1.1, letterSpacing: "-0.02em" }}
            >
              built for people
              <br />
              <G>who play to win.</G>
            </h2>
            <p className="max-w-[280px] text-white/50" style={{ fontSize: "clamp(13px, 1.1vw, 15px)", lineHeight: 1.7 }}>
              10,000+ traders already making their mark. Will you be next?
            </p>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
              <LaunchBtn onClick={login} />
              <InsideBtn onClick={login} />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          FOOTER — legends community image
          ════════════════════════════════════ */}
      <div className="relative overflow-hidden" style={{ height: "clamp(360px, 48vw, 540px)" }}>
        <Image src="/images/legends.webp" alt="Community of traders" fill className="object-cover object-top" />
        <div className="absolute inset-0 bg-[#09090f]/45" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-40 bg-gradient-to-b from-[#09090f]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-[#09090f]" />

        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 px-6 text-center">
          <h2
            className="font-display font-bold tracking-tight"
            style={{ fontSize: "clamp(28px, 5vw, 64px)", lineHeight: 1.06, letterSpacing: "-0.02em" }}
          >
            <span className="text-white">where chads</span>
            <br />
            <G>become legends.</G>
          </h2>
          <p className="max-w-xs text-white/50" style={{ fontSize: "clamp(13px, 1vw, 15px)", lineHeight: 1.65 }}>
            Join the fastest growing trading community on Solana.
          </p>
          <LaunchBtn onClick={login} label="Join Now" />
        </div>
      </div>

      {/* ════════════════════════════════════
          COPYRIGHT BAR
          ════════════════════════════════════ */}
      <footer className="flex flex-col items-center gap-2 border-t border-white/6 px-8 py-5 text-center desktop:flex-row desktop:justify-between desktop:px-16 desktop:text-left">
        <Link href="/" className="inline-flex items-center gap-2" aria-label="ChadWallet home">
          <LogoDiamond size={18} uid="f" />
          <span style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }} className="text-[13px]">
            <span className="font-semibold text-white">Chad</span><span className="font-medium text-white/45">Wallet</span>
          </span>
        </Link>
        <p className="text-[12px] text-white/30">© {new Date().getFullYear()} ChadWallet Labs Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
