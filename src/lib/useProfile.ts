"use client";

import { useCallback, useEffect, useState } from "react";
import { useSolanaWallet } from "./solana";

export interface Profile {
  wallet_address: string;
  handle: string;
  username: string | null;
  bio: string | null;
  avatar_seed: string | null;
  is_seed: boolean;
  created_at: string;
}

export interface TopTrader extends Profile {
  followers: number;
  isFollowing: boolean;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

/**
 * Loads the signed-in user's profile + follow counts and the seeded
 * "top traders" rail, and exposes optimistic follow/unfollow + edit actions.
 */
export function useProfile() {
  const { address } = useSolanaWallet();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [traders, setTraders] = useState<TopTrader[]>([]);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;
    let active = true;

    (async () => {
      // Make sure this wallet has a profile row, then load everything.
      await fetch("/api/profile", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ wallet_address: address }),
      }).catch(() => {});

      const [p, t] = await Promise.all([
        fetch(`/api/profile?wallet=${address}&viewer=${address}`)
          .then((r) => r.json())
          .catch(() => ({})),
        fetch(`/api/profile?top=1&viewer=${address}`)
          .then((r) => r.json())
          .catch(() => ({})),
      ]);
      if (!active) return;

      setProfile(p.profile ?? null);
      setFollowers(p.followers ?? 0);
      setFollowing(p.following ?? 0);
      setTraders(t.traders ?? []);
      setNeedsSetup(!!p.needsSetup || !!t.needsSetup);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [address]);

  const toggleFollow = useCallback(
    async (targetWallet: string, makeFollow: boolean) => {
      if (!address) return;
      // Optimistic update.
      setTraders((ts) =>
        ts.map((t) =>
          t.wallet_address === targetWallet
            ? {
                ...t,
                isFollowing: makeFollow,
                followers: Math.max(0, t.followers + (makeFollow ? 1 : -1)),
              }
            : t
        )
      );
      setFollowing((n) => Math.max(0, n + (makeFollow ? 1 : -1)));

      try {
        if (makeFollow) {
          await fetch("/api/follow", {
            method: "POST",
            headers: JSON_HEADERS,
            body: JSON.stringify({ follower: address, following: targetWallet }),
          });
        } else {
          await fetch(
            `/api/follow?follower=${address}&following=${targetWallet}`,
            { method: "DELETE" }
          );
        }
      } catch {
        /* optimistic state stays; next load reconciles */
      }
    },
    [address]
  );

  const updateProfile = useCallback(
    async (username: string, bio: string) => {
      if (!address) return;
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ wallet_address: address, username, bio }),
      });
      const j = await res.json();
      if (j.profile) setProfile(j.profile);
    },
    [address]
  );

  return {
    address,
    profile,
    followers,
    following,
    traders,
    needsSetup,
    loading,
    toggleFollow,
    updateProfile,
  };
}
