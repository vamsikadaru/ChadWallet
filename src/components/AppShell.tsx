"use client";

import { usePrivy } from "@privy-io/react-auth";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import Landing from "./Landing";
import MajorsTicker from "./MajorsTicker";

function BootSplash() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-transparent"
          style={{ borderTopColor: "var(--accent)", borderRightColor: "var(--accent-2)" }}
        />
        <span className="caps">Loading ChadWallet</span>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy();

  // `ready` is false during SSR and the first client render, so the boot
  // splash hydrates consistently — no client-only mount flag needed.
  if (!ready) return <BootSplash />;
  if (!authenticated) return <Landing />;

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="px-4 pb-28 pt-5 sm:px-6 lg:ml-[248px] lg:px-10 lg:pb-14 lg:pt-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
      <BottomNav />
      <MajorsTicker />
    </div>
  );
}
