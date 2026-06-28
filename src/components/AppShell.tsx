"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { usePathname } from "next/navigation";
import Landing from "./Landing";
import AppHeader from "./AppHeader";
import DiscoveryPanel from "./DiscoveryPanel";
import MajorsTicker from "./MajorsTicker";
import BottomNav from "./BottomNav";
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

/* Expand arrow — same chevrons as fomo's collapse SVG but rotated 180° */
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
  const pathname = usePathname();

  // On the home "/" route, mobile shows the DiscoveryPanel as a full-screen token list
  // instead of the spinner/redirect that desktop sees.
  const isMarkets = pathname === "/";

  if (!ready) return <BootSplash />;
  if (!authenticated) return <Landing />;

  // Width class for the sidebar container (only used on desktop via lg: prefix)
  const sidebarWidth = sidebarOpen || isMarkets ? "lg:w-70 2xl:w-85" : "lg:w-8";

  return (
    <div
      className="flex h-svh max-h-svh w-dvw flex-col gap-3 overflow-hidden pl-4 pt-2"
      style={{ background: "var(--bg-0)" }}
    >
      {/* Header */}
      <div className="shrink-0 pr-4">
        <AppHeader />
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 gap-3 pb-2">
        {/*
         * Left panel:
         * - Mobile "/" (Markets): flex, full-width — becomes the entire screen
         * - Mobile "/trade/…": hidden
         * - Desktop: lg:flex, width controlled by sidebarOpen state
         */}
        <div
          className={`shrink-0 flex-col min-h-0 overflow-hidden transition-[width] duration-150 ease-out ${sidebarWidth} ${
            isMarkets ? "flex w-full pr-4" : "hidden lg:flex"
          }`}
        >
          {sidebarOpen || isMarkets ? (
            <DiscoveryPanel onCollapse={() => setSidebarOpen(false)} />
          ) : (
            /* Collapsed strip — desktop only */
            <div className="hidden lg:flex flex-1 flex-col items-center rounded-xl border border-bg-tertiary py-3">
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

        {/* Main content — hidden on mobile when on the Markets "/" route */}
        <main
          className={`min-h-0 min-w-0 flex-1 flex-col overflow-hidden pr-4 ${
            isMarkets ? "hidden lg:flex" : "flex"
          }`}
        >
          {children}
        </main>
      </div>

      <MajorsTicker />
      <SearchCommand />
      <BottomNav />
    </div>
  );
}
