"use client";

import { useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { AnimatePresence, motion } from "framer-motion";
import {
  Pencil,
  Copy,
  Check,
  CalendarDays,
  Repeat,
  Clock,
  ArrowDownToLine,
  ArrowUpFromLine,
  X,
  LogOut,
} from "lucide-react";
import { FadeIn, EASE } from "@/components/ui/motion";
import NetWorth from "@/components/portfolio/NetWorth";
import HoldingsGrid from "@/components/portfolio/HoldingsGrid";
import ActivityFeed from "@/components/ActivityFeed";
import SectionHeader from "@/components/ui/SectionHeader";
import FollowTopTraders from "@/components/profile/FollowTopTraders";
import { usePortfolio } from "@/lib/usePortfolio";
import { useProfile } from "@/lib/useProfile";
import { avatarGradient, monogram } from "@/lib/handle";
import { truncateAddress } from "@/lib/format";

export default function ProfilePage() {
  const { user, logout } = usePrivy();
  const { loading, netWorth, change24h, holdings, activity } = usePortfolio();
  const {
    address,
    profile,
    followers,
    following,
    traders,
    needsSetup,
    loading: profileLoading,
    toggleFollow,
    updateProfile,
  } = useProfile();

  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [posTab, setPosTab] = useState<"open" | "closed">("open");

  const handle = profile?.handle ?? "anon";
  const displayName = profile?.username || handle;
  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "—";

  const copy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="space-y-6">
      {needsSetup && (
        <FadeIn>
          <div className="glass border border-[#FFC857]/30 bg-[#FFC857]/5 px-4 py-3 text-[13px] text-text-2">
            Social tables aren&apos;t set up yet — follower counts and follows
            won&apos;t persist until the Supabase schema is applied.
          </div>
        </FadeIn>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Identity header */}
          <FadeIn>
            <div className="glass overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-accent/30 via-accent-2/20 to-transparent" />
              <div className="px-6 pb-6">
                <div className="-mt-9 flex items-end justify-between">
                  <div
                    className="grid h-[72px] w-[72px] place-items-center rounded-full text-[26px] font-bold text-white ring-4 ring-bg-1"
                    style={{ background: avatarGradient(profile?.avatar_seed ?? address) }}
                  >
                    {monogram(displayName)}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditing(true)}
                      className="flex h-9 items-center gap-1.5 rounded-[var(--radius-pill)] border border-border bg-bg-1 px-4 text-[13px] font-semibold transition-colors hover:border-[var(--border-bright)]"
                    >
                      <Pencil size={13} /> Edit profile
                    </button>
                    <button
                      onClick={logout}
                      className="flex h-9 items-center gap-1.5 rounded-[var(--radius-pill)] border border-danger/40 bg-bg-1 px-4 text-[13px] font-semibold text-danger transition-colors hover:bg-danger/10"
                    >
                      <LogOut size={13} /> Log out
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div>
                    <h1 className="font-display text-[22px] font-bold leading-tight">
                      {displayName}
                    </h1>
                    <button
                      onClick={copy}
                      className="flex items-center gap-1.5 font-mono text-[12px] text-text-2 transition-colors hover:text-text-1"
                    >
                      @{handle} · {truncateAddress(address, 4, 4)}
                      {copied ? (
                        <Check size={11} className="text-success" />
                      ) : (
                        <Copy size={11} />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-5">
                    <div>
                      <span className="font-mono text-[16px] font-semibold">
                        {following}
                      </span>
                      <span className="ml-1.5 text-[13px] text-text-2">Following</span>
                    </div>
                    <div>
                      <span className="font-mono text-[16px] font-semibold">
                        {followers}
                      </span>
                      <span className="ml-1.5 text-[13px] text-text-2">Followers</span>
                    </div>
                  </div>
                </div>

                {profile?.bio && (
                  <p className="mt-3 text-[13px] text-text-2">{profile.bio}</p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px] text-text-3">
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} /> No hold time
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Repeat size={13} /> {activity.length} trades
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={13} /> Joined {joined}
                  </span>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Portfolio value + chart */}
          <FadeIn delay={0.05}>
            <NetWorth value={netWorth} change24h={change24h} loading={loading} />
          </FadeIn>

          {/* Cash balance row */}
          <FadeIn delay={0.08}>
            <div className="glass flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-bg-2 font-mono text-[15px]">
                  $
                </span>
                <div>
                  <p className="caps">Portfolio value</p>
                  <p className="balance-sensitive font-mono text-[18px] font-semibold">
                    ${netWorth.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Link
                  href="/withdraw"
                  className="flex h-10 items-center gap-2 rounded-[var(--radius-pill)] border border-border bg-bg-1 px-4 text-[13px] font-semibold transition-colors hover:border-[var(--border-bright)]"
                >
                  <ArrowUpFromLine size={15} /> Withdraw
                </Link>
                <Link
                  href="/deposit"
                  className="btn-buy flex h-10 items-center gap-2 rounded-[var(--radius-pill)] px-4 text-[13px] font-semibold text-white"
                >
                  <ArrowDownToLine size={15} /> Deposit
                </Link>
              </div>
            </div>
          </FadeIn>

          {/* Positions */}
          <FadeIn delay={0.1}>
            <div>
              <div className="mb-3 flex items-center gap-1 rounded-[var(--radius-pill)] border border-border bg-bg-1 p-1">
                {(["open", "closed"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setPosTab(t)}
                    className={`rounded-[var(--radius-pill)] px-4 py-1.5 text-[13px] font-medium capitalize transition-colors ${
                      posTab === t ? "bg-bg-2 text-text-1" : "text-text-2 hover:text-text-1"
                    }`}
                  >
                    {t} positions
                  </button>
                ))}
              </div>
              {posTab === "open" ? (
                <HoldingsGrid holdings={holdings} loading={loading} />
              ) : (
                <div className="glass flex flex-col items-center justify-center gap-1 py-12 text-center">
                  <p className="text-[14px] font-medium text-text-1">
                    No closed positions
                  </p>
                  <p className="text-[12px] text-text-2">
                    Positions you fully exit will show here.
                  </p>
                </div>
              )}
            </div>
          </FadeIn>

          {/* Recent swaps */}
          <FadeIn delay={0.12}>
            <div className="glass p-5">
              <SectionHeader title="Recent swaps" action="View all" href="/activity" />
              <div className="-mx-2 mt-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                <ActivityFeed activity={activity.slice(0, 10)} loading={loading} />
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Right rail */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            <FollowTopTraders
              traders={traders}
              onToggle={toggleFollow}
              loading={profileLoading}
            />
          </div>
        </div>
      </div>

      {/* Edit profile modal */}
      <AnimatePresence>
        {editing && (
          <EditModal
            initialUsername={profile?.username ?? ""}
            initialBio={profile?.bio ?? ""}
            onClose={() => setEditing(false)}
            onSave={async (u, b) => {
              await updateProfile(u, b);
              setEditing(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EditModal({
  initialUsername,
  initialBio,
  onClose,
  onSave,
}: {
  initialUsername: string;
  initialBio: string;
  onClose: () => void;
  onSave: (username: string, bio: string) => Promise<void>;
}) {
  const [username, setUsername] = useState(initialUsername);
  const [bio, setBio] = useState(initialBio);
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.18, ease: EASE }}
        className="glass relative z-10 w-full max-w-md p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-[18px] font-bold">Edit profile</h2>
          <button onClick={onClose} aria-label="Close">
            <X size={18} className="text-text-3 hover:text-text-1" />
          </button>
        </div>
        <label className="caps mb-1.5 block">Display name</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={32}
          placeholder="Your name"
          className="mb-4 w-full rounded-[var(--radius-md)] border border-border bg-bg-0/60 px-4 py-2.5 text-[14px] text-text-1 placeholder:text-text-3 focus:border-[var(--border-bright)] focus:outline-none"
        />
        <label className="caps mb-1.5 block">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={140}
          rows={3}
          placeholder="A few words about you"
          className="mb-5 w-full resize-none rounded-[var(--radius-md)] border border-border bg-bg-0/60 px-4 py-2.5 text-[14px] text-text-1 placeholder:text-text-3 focus:border-[var(--border-bright)] focus:outline-none"
        />
        <button
          onClick={async () => {
            setSaving(true);
            await onSave(username.trim(), bio.trim());
          }}
          disabled={saving}
          className="btn-buy h-11 w-full rounded-[var(--radius-md)] text-[14px] font-bold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </motion.div>
    </div>
  );
}
