"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";

const FALLBACK_TRADE = "/trade/So11111111111111111111111111111111111111112";

export default function BottomNav() {
  const pathname = usePathname();
  const [lastTrade, setLastTrade] = useState(FALLBACK_TRADE);

  useEffect(() => {
    const saved = localStorage.getItem("chadwallet:last-trade");
    if (saved) setLastTrade(saved);
    const handler = () => {
      const updated = localStorage.getItem("chadwallet:last-trade");
      if (updated) setLastTrade(updated);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Keep lastTrade in sync when navigating within the same tab
  useEffect(() => {
    if (pathname.startsWith("/trade/")) setLastTrade(pathname);
  }, [pathname]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg-0/90 backdrop-blur-xl lg:hidden">
      <div
        className="mx-auto flex max-w-md items-stretch justify-around px-2"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {NAV_ITEMS.map((item) => {
          const href = item.label === "Trade" ? lastTrade : item.href;
          const matchPath = "match" in item ? item.match : item.href;
          const active =
            matchPath === "/"
              ? pathname === "/"
              : pathname.startsWith(matchPath);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                active ? "text-accent" : "text-text-2"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
