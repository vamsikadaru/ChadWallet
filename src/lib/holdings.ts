import type { Holding, Token } from "./types";
import { getTokenOverview } from "./birdeye";

/** Wrapped-SOL mint — Birdeye prices native SOL under this address. */
export const SOL_MINT = "So11111111111111111111111111111111111111112";
const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

/** A raw on-chain balance before pricing/metadata is attached. */
interface RawBalance {
  mint: string;
  amount: number; // ui amount (decimals applied)
}

/**
 * Reads the wallet's native SOL + SPL token balances directly from the RPC,
 * then enriches each with live price/metadata from Birdeye. Returns holdings
 * sorted by USD value, plus the live SOL price (used elsewhere for activity).
 *
 * Everything is best-effort: a failed price lookup just drops that token rather
 * than breaking the whole portfolio.
 */
export async function fetchHoldings(
  address: string,
  rpcUrl: string
): Promise<{ holdings: Holding[]; netWorth: number; solPrice: number }> {
  const { Connection, PublicKey, LAMPORTS_PER_SOL } = await import(
    "@solana/web3.js"
  );
  const conn = new Connection(rpcUrl, "confirmed");
  const owner = new PublicKey(address);

  // Native SOL + both token programs (legacy + Token-2022), in parallel.
  const [lamports, legacy, token2022] = await Promise.all([
    conn.getBalance(owner),
    conn.getParsedTokenAccountsByOwner(owner, {
      programId: new PublicKey(TOKEN_PROGRAM_ID),
    }),
    conn
      .getParsedTokenAccountsByOwner(owner, {
        programId: new PublicKey(TOKEN_2022_PROGRAM_ID),
      })
      .catch(() => ({ value: [] as never[] })),
  ]);

  const raw: RawBalance[] = [];
  const solBalance = lamports / LAMPORTS_PER_SOL;
  if (solBalance > 0) raw.push({ mint: SOL_MINT, amount: solBalance });

  for (const acct of [...legacy.value, ...token2022.value]) {
    const info = acct.account.data.parsed?.info;
    const mint: string | undefined = info?.mint;
    const uiAmount: number | undefined = info?.tokenAmount?.uiAmount;
    if (mint && uiAmount && uiAmount > 0) {
      raw.push({ mint, amount: uiAmount });
    }
  }

  // Cap how many tokens we price so a dusty wallet can't fan out unbounded.
  const top = raw.slice(0, 30);

  const priced = await Promise.allSettled(
    top.map(async (b): Promise<Holding | null> => {
      const token: Token | null = await getTokenOverview(b.mint);
      if (!token || !token.price) return null;
      const value = b.amount * token.price;
      if (value < 0.01) return null; // hide sub-cent dust
      return { token, balance: b.amount, value };
    })
  );

  const holdings = priced
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter((h): h is Holding => h !== null)
    .sort((a, b) => b.value - a.value);

  const netWorth = holdings.reduce((sum, h) => sum + h.value, 0);
  const solPrice =
    holdings.find((h) => h.token.address === SOL_MINT)?.token.price ?? 0;

  return { holdings, netWorth, solPrice };
}

/** Value-weighted 24h change across holdings (real, not hardcoded). */
export function weightedChange24h(holdings: Holding[]): number {
  const total = holdings.reduce((s, h) => s + h.value, 0);
  if (total <= 0) return 0;
  return holdings.reduce(
    (s, h) => s + (h.token.priceChange24h * h.value) / total,
    0
  );
}
