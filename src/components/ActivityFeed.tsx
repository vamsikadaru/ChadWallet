"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Copy, Check } from "lucide-react";
import TokenLogo from "./ui/TokenLogo";
import Skeleton from "./ui/Skeleton";
import { staggerParent, staggerChild } from "./ui/motion";
import { compact, formatUsd, relativeTime, truncateAddress } from "@/lib/format";
import type { Activity } from "@/lib/types";

function Row({ a }: { a: Activity }) {
  const [copied, setCopied] = useState(false);
  const buy = a.type === "buy";

  const copy = () => {
    navigator.clipboard.writeText(a.txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      variants={staggerChild}
      className="flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-2.5 transition-colors hover:bg-bg-2/60"
    >
      <div
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
        style={{
          background: buy ? "rgba(20,241,149,0.12)" : "rgba(255,75,75,0.12)",
          color: buy ? "var(--success)" : "var(--danger)",
        }}
      >
        {buy ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
      </div>

      <div className="flex items-center gap-2">
        <TokenLogo src={a.token.logoURI} symbol={a.token.symbol} size={22} />
        <div className="leading-tight">
          <p className="text-[13px] font-medium">
            <span className={buy ? "text-success" : "text-danger"}>
              {buy ? "Bought" : "Sold"}
            </span>{" "}
            {a.token.symbol}
          </p>
          <button
            onClick={copy}
            className="flex items-center gap-1 font-mono text-[11px] text-text-3 transition-colors hover:text-text-2"
          >
            {truncateAddress(a.txHash, 6, 4)}
            {copied ? <Check size={10} className="text-success" /> : <Copy size={10} />}
          </button>
        </div>
      </div>

      <div className="ml-auto text-right">
        <p className="font-mono text-[13px] font-medium">
          {compact(a.amountToken)}
        </p>
        <p className="font-mono text-[11px] text-text-2">{formatUsd(a.amountUsd)}</p>
      </div>

      <span className="ml-1 w-9 shrink-0 text-right font-mono text-[11px] text-text-3">
        {relativeTime(a.timestamp)}
      </span>
    </motion.div>
  );
}

export default function ActivityFeed({
  activity,
  loading,
}: {
  activity: Activity[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-2.5">
            <Skeleton className="h-9 w-9" rounded="full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2.5 w-16" />
            </div>
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>
    );
  }

  if (!activity.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-10 text-center">
        <p className="text-[14px] font-medium text-text-1">No activity yet</p>
        <p className="text-[12px] text-text-2">Your trades will show up here.</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerParent}
      initial="hidden"
      animate="show"
      className="space-y-0.5"
    >
      {activity.map((a) => (
        <Row key={a.id} a={a} />
      ))}
    </motion.div>
  );
}
