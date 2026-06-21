"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import TokenLogo from "../ui/TokenLogo";
import PriceBadge from "../ui/PriceBadge";
import Skeleton from "../ui/Skeleton";
import Sparkline from "../ui/Sparkline";
import { staggerParent, staggerChild } from "../ui/motion";
import { formatUsd, compact } from "@/lib/format";
import type { Holding } from "@/lib/types";

export default function HoldingsGrid({
  holdings,
  loading,
}: {
  holdings: Holding[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10" rounded="full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-2.5 w-20" />
              </div>
            </div>
            <Skeleton className="mt-5 h-6 w-24" />
            <Skeleton className="mt-3 h-8 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerParent}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-4 md:grid-cols-3"
    >
      {holdings.map((h) => (
        <motion.div key={h.token.address} variants={staggerChild}>
          <Link href={`/trade/${h.token.address}`}>
            <motion.div
              whileHover={{ scale: 1.015, borderColor: "rgba(255,255,255,0.12)" }}
              transition={{ duration: 0.2 }}
              className="glass h-full p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TokenLogo src={h.token.logoURI} symbol={h.token.symbol} size={36} />
                  <div className="min-w-0">
                    <p className="truncate font-display text-[15px] font-bold leading-tight">
                      {h.token.symbol}
                    </p>
                    <p className="font-mono text-[11px] text-text-2">
                      {compact(h.balance)} {h.token.symbol}
                    </p>
                  </div>
                </div>
                <PriceBadge value={h.token.priceChange24h} showArrow={false} />
              </div>

              <p className="mt-4 font-mono text-[20px] font-semibold tracking-tight">
                {formatUsd(h.value)}
              </p>

              <div className="mt-2 -mx-1">
                <Sparkline
                  data={h.token.sparkline ?? []}
                  positive={h.token.priceChange24h >= 0}
                  height={34}
                />
              </div>
            </motion.div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
