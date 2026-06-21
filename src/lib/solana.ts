"use client";

import {
  useWallets,
  useSignAndSendTransaction,
} from "@privy-io/react-auth/solana";

/** CAIP-2 id for Solana mainnet-beta. */
const SOLANA_MAINNET = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" as const;

/**
 * Thin wrapper over Privy's v3 Solana hooks so components don't depend on the
 * exact hook names / subpaths. Exposes the active embedded wallet address and
 * a helper to sign + send a serialized transaction.
 */
export function useSolanaWallet() {
  const { wallets } = useWallets();
  const wallet = wallets[0];
  const { signAndSendTransaction } = useSignAndSendTransaction();

  async function sendSerialized(serialized: Uint8Array): Promise<Uint8Array> {
    if (!wallet) throw new Error("No connected Solana wallet");
    const { signature } = await signAndSendTransaction({
      transaction: serialized,
      wallet,
      chain: SOLANA_MAINNET,
    });
    return signature;
  }

  return {
    wallet,
    address: wallet?.address as string | undefined,
    sendSerialized,
  };
}
