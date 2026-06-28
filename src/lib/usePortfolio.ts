"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSolanaWallet } from "./solana";
import { fetchHoldings, weightedChange24h } from "./holdings";
import type { Activity, Holding } from "./types";

interface PortfolioState {
  loading: boolean;
  netWorth: number;
  change24h: number;
  holdings: Holding[];
  activity: Activity[];
  solPrice: number;
}

/**
 * Live portfolio data for the connected embedded wallet.
 *
 *   • Holdings + net worth come from the real on-chain balances (RPC) priced
 *     with live Birdeye quotes — no mock fallback when a wallet is connected.
 *   • 24h change is value-weighted across actual holdings.
 *   • Activity is the wallet's Supabase trade history, valued at the live SOL
 *     price (not a hardcoded constant).
 *
 * A brand-new wallet with no funds correctly reports $0 and an empty grid.
 */
export function usePortfolio(): PortfolioState {
  const { authenticated } = usePrivy();
  const { address } = useSolanaWallet();

  const [loading, setLoading] = useState(true);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [netWorth, setNetWorth] = useState(0);
  const [change24h, setChange24h] = useState(0);
  const [solPrice, setSolPrice] = useState(0);
  const [activity, setActivity] = useState<Activity[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!authenticated || !address) {
        if (active) setLoading(false);
        return;
      }
      // Route RPC calls through our own server-side proxy (/api/rpc) so the
      // browser never hits the public Solana endpoint directly (avoids CORS
      // errors and browser-side rate-limits on the free public RPC).
      const rpc = `${window.location.origin}/api/rpc`;

      let livePrice = solPrice;
      try {
        const { holdings: hs, netWorth: nw, solPrice: sp } =
          await fetchHoldings(address, rpc);
        if (active) {
          setHoldings(hs);
          setNetWorth(nw);
          setChange24h(weightedChange24h(hs));
          if (sp) setSolPrice(sp);
        }
        livePrice = sp || livePrice;
      } catch {
        // Portfolio data unavailable — app continues without it
      }

      try {
        const res = await fetch(`/api/trades?wallet_address=${address}`);
        const data = await res.json();
        if (active && Array.isArray(data.trades)) {
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
                token: {
                  symbol: t.token_address.slice(0, 4),
                  address: t.token_address,
                },
                amountToken: t.amount_token,
                amountUsd: t.amount_sol * (livePrice || 0),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, address]);

  return { loading, netWorth, change24h, holdings, activity, solPrice };
}
