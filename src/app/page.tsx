"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTrendingTokens } from "@/lib/birdeye";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    getTrendingTokens().then((tokens) => {
      if (active && tokens[0]) {
        router.replace(`/trade/${tokens[0].address}`);
      }
    });
    return () => { active = false; };
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center text-text-secondary">
      <Loader2 size={20} className="animate-spin" />
    </div>
  );
}
