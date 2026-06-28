"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTrendingTokens } from "@/lib/birdeye";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    getTrendingTokens().then((tokens) => {
      if (active && tokens[0]) router.replace(`/trade/${tokens[0].address}`);
    });
    return () => { active = false; };
  }, [router]);

  return <div className="flex h-full items-center justify-center" />;
}
