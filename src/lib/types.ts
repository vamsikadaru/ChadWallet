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
  // Optional analytics (present when sourced from BirdEye token_overview).
  holders?: number;
  buys24h?: number;
  sells24h?: number;
  vBuy24h?: number; // buy volume USD
  vSell24h?: number; // sell volume USD
  change5m?: number;
  change1h?: number;
  change4h?: number;
  supply?: number;
  description?: string;
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

export interface TokenSecurity {
  mintAuthority: string | null;
  freezeAuthority: string | null;
  top10HolderPercent: number; // 0–100
  creatorAddress?: string;
  isToken2022?: boolean;
  transferFeeEnabled?: boolean;
}

export interface TopTrader {
  address: string;
  volume: number;   // total USD volume
  buy: number;      // buy trade count
  sell: number;     // sell trade count
  pnl: number;      // unrealised PnL USD
}
