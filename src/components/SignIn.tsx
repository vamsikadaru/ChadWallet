"use client";

import { useLogin } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import { EASE } from "./ui/motion";
import Logo from "./Logo";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 0-24c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 1 0 24 44c11 0 20-9 20-20 0-1.3-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.5 5C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C40.9 36.3 44 30.7 44 24c0-1.3-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 12.6c-.03-2.6 2.13-3.85 2.23-3.91-1.22-1.78-3.11-2.02-3.78-2.05-1.6-.16-3.13.94-3.95.94-.81 0-2.07-.92-3.4-.9-1.75.03-3.36 1.02-4.26 2.58-1.82 3.15-.47 7.82 1.3 10.38.86 1.25 1.89 2.66 3.24 2.61 1.3-.05 1.79-.84 3.36-.84 1.56 0 2.01.84 3.38.81 1.4-.02 2.28-1.28 3.13-2.54.99-1.45 1.4-2.86 1.42-2.93-.03-.01-2.72-1.04-2.75-4.13zM14.6 4.97c.72-.87 1.2-2.08 1.07-3.29-1.03.04-2.28.69-3.02 1.56-.66.77-1.24 2-1.08 3.18 1.15.09 2.32-.58 3.03-1.45z" />
    </svg>
  );
}

export default function SignIn() {
  const { login } = useLogin();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5">
      {/* Animated gradient orbs (CSS only) */}
      <div className="orb h-[420px] w-[420px]" style={{ top: "12%", left: "18%" }} />
      <div
        className="orb h-[360px] w-[360px]"
        style={{ bottom: "8%", right: "14%", animationDelay: "-6s", opacity: 0.4 }}
      />
      <div className="pointer-events-none absolute inset-0 bg-bg-0/40" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="glass relative z-10 w-full max-w-[400px] p-8 sm:p-10"
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        <div className="flex flex-col items-center text-center">
          <Logo size="lg" />
          <h1 className="mt-7 font-display text-[26px] font-bold leading-tight tracking-tight">
            Trade Solana like a&nbsp;
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(100deg, var(--accent), var(--accent-2))",
              }}
            >
              Chad
            </span>
          </h1>
          <p className="mt-2 max-w-[280px] text-[14px] leading-relaxed text-text-2">
            Sign in to spin up a non-custodial wallet and start trading trending
            tokens in seconds.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <SignInButton onClick={login} icon={<GoogleIcon />} label="Continue with Google" />
          <SignInButton onClick={login} icon={<AppleIcon />} label="Continue with Apple" />
        </div>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-text-3">
          By continuing you agree to the Terms of Service and acknowledge the
          Privacy Policy. Your keys stay yours.
        </p>
      </motion.div>
    </div>
  );
}

function SignInButton({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      className="group relative flex h-12 items-center justify-center gap-3 rounded-[var(--radius-pill)] border border-border bg-bg-2 text-[14px] font-medium text-text-1 transition-colors hover:border-[var(--border-bright)]"
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-[var(--radius-pill)] opacity-0 transition-opacity group-hover:opacity-100"
        style={{ boxShadow: "0 0 24px rgba(153,69,255,0.25)" }}
      />
      <span className="relative z-10 flex items-center gap-3">
        {icon}
        {label}
      </span>
    </motion.button>
  );
}
