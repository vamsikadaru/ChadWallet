export interface Token {
  address: string;
  name: string;
  symbol: string;
  logoURI?: string;
  price: number;
  priceChange24h: number; // percent
  volume24h: number;
  marketCap: number;
  liquidity?: number;
  sparkline?: number[];
}

export interface Holding {
  token: Token;
  balance: number; // amount of token
  value: number; // usd
}

export interface Activity {
  id: string;
  type: "buy" | "sell";
  token: { symbol: string; address: string; logoURI?: string };
  amountToken: number;
  amountUsd: number;
  txHash: string;
  timestamp: number;
}

export interface TradePrint {
  id: string;
  side: "buy" | "sell";
  amountUsd: number;
  price: number;
  maker: string;
  timestamp: number;
}

export interface Holder {
  address: string;
  pct: number; // % of supply
  amount: number;
}
