"use client";

import { UserPlus } from "lucide-react";
import { avatarGradient, monogram } from "@/lib/handle";
import type { TopTrader } from "@/lib/useProfile";

export default function FollowTopTraders({
  traders,
  onToggle,
  loading,
}: {
  traders: TopTrader[];
  onToggle: (wallet: string, follow: boolean) => void;
  loading?: boolean;
}) {
  return (
    <div className="glass p-5">
      <div className="mb-4 flex items-center gap-2">
        <UserPlus size={16} className="text-accent" />
        <h3 className="font-display text-[15px] font-bold">Follow top traders</h3>
      </div>

      <div className="space-y-1">
        {loading && traders.length === 0
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="h-9 w-9 animate-pulse rounded-full bg-bg-2/50" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 w-20 animate-pulse rounded bg-bg-2/50" />
                  <div className="h-2 w-14 animate-pulse rounded bg-bg-2/40" />
                </div>
              </div>
            ))
          : traders.map((t) => (
              <div key={t.wallet_address} className="flex items-center gap-3 py-1.5">
                <div
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-bold text-white"
                  style={{ background: avatarGradient(t.avatar_seed ?? t.handle) }}
                >
                  {monogram(t.username ?? t.handle)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">
                    {t.username ?? t.handle}
                  </p>
                  <p className="truncate font-mono text-[11px] text-text-2">
                    @{t.handle}
                  </p>
                </div>
                <button
                  onClick={() => onToggle(t.wallet_address, !t.isFollowing)}
                  className={`h-8 shrink-0 rounded-[var(--radius-pill)] px-4 text-[12px] font-semibold transition-colors ${
                    t.isFollowing
                      ? "border border-border bg-transparent text-text-2 hover:text-text-1"
                      : "bg-accent text-white hover:opacity-90"
                  }`}
                >
                  {t.isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            ))}
      </div>
    </div>
  );
}
