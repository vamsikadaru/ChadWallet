"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import Landing from "./Landing";
import AppHeader from "./AppHeader";
import DiscoveryPanel from "./DiscoveryPanel";
import MajorsTicker from "./MajorsTicker";
import SearchCommand from "./SearchCommand";

function BootSplash() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-transparent"
        style={{ borderTopColor: "var(--accent)", borderRightColor: "var(--accent-2)" }}
      />
    </div>
  );
}

/* Expand arrow */
function ExpandIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="rotate-180">
      <path
        d="M7.25609 11.911C7.58193 12.2369 7.58193 12.7636 7.25609 13.0894C7.09359 13.2519 6.88023 13.3336 6.6669 13.3336C6.45357 13.3336 6.24021 13.2519 6.07771 13.0894L0.244375 7.25609C-0.0814583 6.93026 -0.0814583 6.40354 0.244375 6.07771L6.07771 0.244375C6.40354 -0.0814583 6.93026 -0.0814583 7.25609 0.244375C7.58193 0.570208 7.58193 1.09693 7.25609 1.42276L2.01195 6.6669L7.25609 11.911ZM7.84529 6.6669L13.0894 1.42276C13.4153 1.09693 13.4153 0.570208 13.0894 0.244375C12.7636 -0.0814583 12.2369 -0.0814583 11.911 0.244375L6.07771 6.07771C5.75187 6.40354 5.75187 6.93026 6.07771 7.25609L11.911 13.0894C12.0735 13.2519 12.2869 13.3336 12.5002 13.3336C12.7136 13.3336 12.9269 13.2519 13.0894 13.0894C13.4153 12.7636 13.4153 12.2369 13.0894 11.911L7.84529 6.6669Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!ready) return <BootSplash />;
  if (!authenticated) return <Landing />;

  // md (≥768 px) = mobile "Request Desktop Site" — narrower sidebar
  // lg (≥1024 px) = real desktop — full-width sidebar
  const sidebarWidth = sidebarOpen ? "md:w-56 lg:w-70 2xl:w-85" : "md:w-8";

  return (
    <div
      className="flex h-svh max-h-svh w-dvw flex-col gap-3 overflow-hidden pl-4 pt-2"
      style={{ background: "var(--bg-0)" }}
    >
      {/* Mobile-only gate — hidden once the browser is in desktop mode (≥768px virtual viewport) */}
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 px-8 text-center md:hidden"
        style={{ background: "var(--bg-0)" }}>
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-bg-tertiary"
          style={{ background: "var(--bg-1)" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-secondary">
            <rect x="5" y="2" width="14" height="20" rx="2" />
            <line x1="12" y1="17" x2="12" y2="17.5" strokeLinecap="round" strokeWidth="2" />
          </svg>
        </div>
        <div className="space-y-2">
          <p className="text-[18px] font-semibold text-text-primary">Desktop only</p>
          <p className="text-[13px] leading-relaxed text-text-secondary">
            ChadWallet isn&apos;t optimised for mobile yet.
            <br />
            Open in a browser and enable <strong className="text-text-primary">Request Desktop Website</strong> to continue.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="shrink-0 pr-4">
        <AppHeader />
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 gap-3 pb-2">
        {/* Left panel — desktop only */}
        <div
          className={`shrink-0 flex-col min-h-0 overflow-hidden transition-[width] duration-150 ease-out ${sidebarWidth} hidden md:flex`}
        >
          {sidebarOpen ? (
            <DiscoveryPanel onCollapse={() => setSidebarOpen(false)} />
          ) : (
            <div className="flex flex-1 flex-col items-center rounded-xl border border-bg-tertiary py-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1 text-text-secondary transition-colors hover:text-text-primary"
                title="Expand panel"
              >
                <ExpandIcon />
              </button>
            </div>
          )}
        </div>

        {/* Main content — scrollable on mobile, fixed on desktop */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto md:overflow-hidden pr-4">
          {children}
        </main>
      </div>

      <MajorsTicker />
      <SearchCommand />
    </div>
  );
}
