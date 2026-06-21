"use client";

import { useMemo, useState } from "react";
import { FadeIn } from "@/components/ui/motion";
import SectionBoundary from "@/components/SectionBoundary";
import ActivityFeed from "@/components/ActivityFeed";
import { usePortfolio } from "@/lib/usePortfolio";

const FILTERS = ["All", "Buys", "Sells"] as const;
type Filter = (typeof FILTERS)[number];

export default function ActivityPage() {
  const { activity, loading } = usePortfolio();
  const [filter, setFilter] = useState<Filter>("All");

  const filtered = useMemo(() => {
    if (filter === "Buys") return activity.filter((a) => a.type === "buy");
    if (filter === "Sells") return activity.filter((a) => a.type === "sell");
    return activity;
  }, [activity, filter]);

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="caps">History</p>
            <h1 className="font-display text-[28px] font-bold tracking-tight">
              Activity
            </h1>
          </div>
          <div className="flex items-center gap-1 rounded-[var(--radius-pill)] border border-border bg-bg-1 p-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-[var(--radius-pill)] px-4 py-1.5 text-[13px] font-medium transition-colors ${
                  filter === f ? "bg-bg-2 text-text-1" : "text-text-2 hover:text-text-1"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <SectionBoundary label="activity">
          <div className="glass p-4 sm:p-6">
            <ActivityFeed activity={filtered} loading={loading} />
          </div>
        </SectionBoundary>
      </FadeIn>
    </div>
  );
}
