"use client";

import { usePrivy } from "@privy-io/react-auth";
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

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy();

  if (!ready) return <BootSplash />;
  if (!authenticated) return <Landing />;

  return (
    /*
     * Matches fomo's root layout:
     *   pt-2 pl-4  — only top + left padding; right padding lives on the header wrapper
     *   gap-3      — vertical gap between header and body
     *   h-svh / max-h-svh / overflow-hidden — full-screen, no page scroll
     */
    <div
      className="flex h-svh max-h-svh w-dvw flex-col gap-3 overflow-hidden pl-4 pt-2"
      style={{ background: "var(--bg-0)" }}
    >
      {/* Header — pr-4 wrapper mirrors fomo's <div class="pr-4"> around the header */}
      <div className="shrink-0 pr-4">
        <AppHeader />
      </div>

      {/* Body: left panel + content — no extra padding, gap-3 between columns */}
      <div className="flex min-h-0 flex-1 gap-3 pb-2">
        {/* Left discovery panel — desktop only, w-70 (280px = 17.5rem) matching fomo */}
        <div className="hidden min-h-0 w-70 shrink-0 flex-col 2xl:w-85 lg:flex">
          <DiscoveryPanel />
        </div>

        {/* Main content — pr-4 closes the right-side gap like fomo */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pr-4">
          {children}
        </main>
      </div>

      {/* Bottom status bar — desktop only */}
      <MajorsTicker />

      {/* Search modal */}
      <SearchCommand />

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
