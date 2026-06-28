"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTrendingTokens } from "@/lib/birdeye";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // On mobile (< lg), AppShell shows the DiscoveryPanel token list directly for "/".
    // Only redirect to a trade pair on desktop where the sidebar and chart co-exist.
    if (!window.matchMedia("(min-width: 1024px)").matches) return;

    let active = true;
    getTrendingTokens().then((tokens) => {
      if (active && tokens[0]) router.replace(`/trade/${tokens[0].address}`);
    });
    return () => { active = false; };
  }, [router]);

  // Desktop shows a brief spinner while the redirect resolves.
  // Mobile renders nothing — the AppShell sidebar IS the content on this route.
  return <div className="hidden lg:flex h-full items-center justify-center" />;
}
