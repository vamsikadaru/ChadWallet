"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import TokenLogo from "../ui/TokenLogo";
import PriceBadge from "../ui/PriceBadge";
import { formatPrice } from "@/lib/format";
import type { Token } from "@/lib/types";

export default function HotStrip({ tokens }: { tokens: Token[] }) {
  const hot = [...tokens]
    .sort((a, b) => Math.abs(b.priceChange24h) - Math.abs(a.priceChange24h))
    .slice(0, 8);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Flame size={15} className="text-accent" />
        <span className="caps">Hot right now</span>
      </div>
      <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {hot.map((t, i) => {
          const velocity = Math.min(100, Math.abs(t.priceChange24h) * 4);
          return (
            <motion.div
              key={t.address}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <Link
                href={`/trade/${t.address}`}
                className="glass flex w-[186px] shrink-0 flex-col gap-2 p-3.5 transition-colors hover:border-[var(--border-bright)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <TokenLogo
                      src={t.logoURI}
                      symbol={t.symbol}
                      size={26}
                      className="shrink-0"
                    />
                    <span className="truncate font-display text-[14px] font-bold">
                      {t.symbol}
                    </span>
                  </div>
                  <span className="shrink-0">
                    <PriceBadge value={t.priceChange24h} showArrow={false} />
                  </span>
                </div>
                <span className="font-mono text-[13px] text-text-1">
                  {formatPrice(t.price)}
                </span>
                {/* momentum / velocity bar */}
                <div className="h-1 overflow-hidden rounded-full bg-bg-2">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${velocity}%`,
                      background:
                        t.priceChange24h >= 0
                          ? "var(--accent-2)"
                          : "var(--danger)",
                    }}
                  />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
