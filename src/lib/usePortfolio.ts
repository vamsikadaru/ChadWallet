"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSolanaWallet } from "./solana";
import {
  MOCK_HOLDINGS,
  MOCK_ACTIVITY,
  mockNetWorth,
  mockNetWorthSeries,
} from "./mock";
import type { Activity, Holding } from "./types";

interface PortfolioState {
  loading: boolean;
  netWorth: number;
  change24h: number;
  series: number[];
  holdings: Holding[];
  activity: Activity[];
  solBalance: number;
}

/**
 * Portfolio data. Uses the real embedded-wallet SOL balance when an RPC is
 * configured, and Supabase trade history when available — otherwise falls
 * back to representative demo data so the UI is always fully populated.
 */
export function usePortfolio(): PortfolioState {
  const { authenticated } = usePrivy();
  const { address } = useSolanaWallet();

  const [loading, setLoading] = useState(true);
  const [solBalance, setSolBalance] = useState(0);
  const [activity, setActivity] = useState<Activity[]>(MOCK_ACTIVITY);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!authenticated || !address) {
        if (active) setLoading(false);
        return;
      }
      const rpc = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL;
      try {
        if (rpc) {
          const { Connection, PublicKey, LAMPORTS_PER_SOL } = await import(
            "@solana/web3.js"
          );
          const conn = new Connection(rpc, "confirmed");
          const lamports = await conn.getBalance(new PublicKey(address!));
          if (active) setSolBalance(lamports / LAMPORTS_PER_SOL);
        }
      } catch (e) {
        console.error("balance fetch failed", e);
      }

      try {
        const res = await fetch(`/api/trades?wallet_address=${address}`);
        const data = await res.json();
        if (active && Array.isArray(data.trades) && data.trades.length) {
          setActivity(
            data.trades.map(
              (t: {
                id: string;
                type: "buy" | "sell";
                token_address: string;
                amount_token: number;
                amount_sol: number;
                created_at: string;
              }): Activity => ({
                id: t.id,
                type: t.type,
                token: { symbol: t.token_address.slice(0, 4), address: t.token_address },
                amountToken: t.amount_token,
                amountUsd: t.amount_sol * 168,
                txHash: t.id,
                timestamp: new Date(t.created_at).getTime(),
              })
            )
          );
        }
      } catch (e) {
        console.error("trades fetch failed", e);
      }

      if (active) setLoading(false);
    }

    load();
    const interval = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [authenticated, address]);

  // Net worth = demo holdings + real SOL balance contribution (illustrative).
  const baseNet = mockNetWorth();
  const netWorth = baseNet + solBalance * 168.42;

  return {
    loading,
    netWorth,
    change24h: 4.21,
    series: mockNetWorthSeries(),
    holdings: MOCK_HOLDINGS,
    activity,
    solBalance,
  };
}
