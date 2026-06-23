"use client";

import Link from "next/link";
import { ArrowDownToLine, Compass } from "lucide-react";
import { FadeIn } from "@/components/ui/motion";
import SectionHeader from "@/components/ui/SectionHeader";
import SectionBoundary from "@/components/SectionBoundary";
import NetWorth from "@/components/portfolio/NetWorth";
import HoldingsGrid from "@/components/portfolio/HoldingsGrid";
import ActivityFeed from "@/components/ActivityFeed";
import { usePortfolio } from "@/lib/usePortfolio";

export default function PortfolioPage() {
  const { loading, netWorth, change24h, holdings, activity } = usePortfolio();

  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="caps">Portfolio</p>
            <h1 className="font-display text-[28px] font-bold tracking-tight">
              Overview
            </h1>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/deposit"
              className="btn-buy flex h-11 items-center gap-2 rounded-[var(--radius-pill)] px-5 text-[14px] font-semibold text-white transition-[filter]"
            >
              <ArrowDownToLine size={16} />
              Deposit
            </Link>
            <Link
              href="/trending"
              className="flex h-11 items-center gap-2 rounded-[var(--radius-pill)] border border-border bg-bg-1 px-5 text-[14px] font-medium text-text-1 transition-colors hover:border-[var(--border-bright)]"
            >
              <Compass size={16} />
              Explore
            </Link>
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <FadeIn delay={0.05} className="lg:col-span-2">
          <SectionBoundary label="net worth">
            <NetWorth value={netWorth} change24h={change24h} loading={loading} />
          </SectionBoundary>
        </FadeIn>

        <FadeIn delay={0.1} className="lg:col-span-1">
          <SectionBoundary label="activity">
            <div className="glass h-full p-6">
              <SectionHeader title="Activity" action="View all" href="/activity" />
              <div className="-mx-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                <ActivityFeed activity={activity.slice(0, 8)} loading={loading} />
              </div>
            </div>
          </SectionBoundary>
        </FadeIn>
      </div>

      <FadeIn delay={0.15}>
        <SectionBoundary label="holdings">
          <SectionHeader title="Holdings" />
          <HoldingsGrid holdings={holdings} loading={loading} />
        </SectionBoundary>
      </FadeIn>
    </div>
  );
}
