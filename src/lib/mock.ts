import type { Token, Holding, Activity, TradePrint, Holder } from "./types";

/** Seeded pseudo-random so SSR and client agree (no hydration mismatch). */
function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function makeSparkline(seed: number, points = 32, up = true): number[] {
  const rnd = seeded(seed);
  const out: number[] = [];
  let v = 100;
  const drift = up ? 0.6 : 0.4;
  for (let i = 0; i < points; i++) {
    v += (rnd() - drift) * 6;
    out.push(Math.max(5, v));
  }
  return out;
}

export const MOCK_TOKENS: Token[] = [
  {
    address: "So11111111111111111111111111111111111111112",
    name: "Solana",
    symbol: "SOL",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    price: 168.42,
    priceChange24h: 4.21,
    volume24h: 1_240_000_000,
    marketCap: 78_000_000_000,
    liquidity: 540_000_000,
    sparkline: makeSparkline(1, 32, true),
  },
  {
    address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    name: "Bonk",
    symbol: "BONK",
    logoURI:
      "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I",
    price: 0.0000241,
    priceChange24h: 15.4,
    volume24h: 92_000_000,
    marketCap: 1_700_000_000,
    liquidity: 31_000_000,
    sparkline: makeSparkline(2, 32, true),
  },
  {
    address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
    name: "Wif",
    symbol: "WIF",
    logoURI:
      "https://bafkreibk3covs5ltyqxa272uodhculbr6kea6betidfwy3ajsav2vjzyum.ipfs.nftstorage.link",
    price: 2.31,
    priceChange24h: -3.12,
    volume24h: 142_000_000,
    marketCap: 2_300_000_000,
    liquidity: 48_000_000,
    sparkline: makeSparkline(3, 32, false),
  },
  {
    address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    name: "Jupiter",
    symbol: "JUP",
    logoURI: "https://static.jup.ag/jup/icon.png",
    price: 0.92,
    priceChange24h: 6.7,
    volume24h: 64_000_000,
    marketCap: 1_200_000_000,
    liquidity: 22_000_000,
    sparkline: makeSparkline(4, 32, true),
  },
  {
    address: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
    name: "Popcat",
    symbol: "POPCAT",
    logoURI:
      "https://bafkreig6as56pkmgqzlljtgykz5sb6wfx53l6mvtgbkuocekkdgrkthnre.ipfs.nftstorage.link",
    price: 1.04,
    priceChange24h: 22.8,
    volume24h: 38_000_000,
    marketCap: 1_020_000_000,
    liquidity: 14_000_000,
    sparkline: makeSparkline(5, 32, true),
  },
  {
    address: "MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5",
    name: "Cat in a Dogs World",
    symbol: "MEW",
    logoURI:
      "https://bafkreidlwyr565dxtao2ipsze6bmzpszqzybz7sqi2zaet5fhgggw5q3fu.ipfs.nftstorage.link",
    price: 0.0078,
    priceChange24h: -8.4,
    volume24h: 19_000_000,
    marketCap: 690_000_000,
    liquidity: 9_000_000,
    sparkline: makeSparkline(6, 32, false),
  },
  {
    address: "HhJpBhRRn4g56VsyLuT8DL5Bv31HkXqsrahTTUCZeZg4",
    name: "Myro",
    symbol: "MYRO",
    logoURI:
      "https://bafkreidoa3kgxsk2x4pjzwgkz66hcsdvujvh3z7tgw7gke7jbgr3aqv2by.ipfs.nftstorage.link",
    price: 0.118,
    priceChange24h: 11.2,
    volume24h: 12_000_000,
    marketCap: 118_000_000,
    liquidity: 5_000_000,
    sparkline: makeSparkline(7, 32, true),
  },
  {
    address: "27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4",
    name: "Jito",
    symbol: "JTO",
    logoURI: "https://metadata.jito.network/token/jto/image",
    price: 3.42,
    priceChange24h: 1.9,
    volume24h: 28_000_000,
    marketCap: 410_000_000,
    liquidity: 11_000_000,
    sparkline: makeSparkline(8, 32, true),
  },
  {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    name: "USD Coin",
    symbol: "USDC",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
    price: 1.00,
    priceChange24h: 0.01,
    volume24h: 2_100_000_000,
    marketCap: 43_000_000_000,
    liquidity: 900_000_000,
    sparkline: makeSparkline(9, 32, true),
  },
  {
    address: "rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof",
    name: "Render",
    symbol: "RENDER",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof/logo.png",
    price: 7.21,
    priceChange24h: 8.4,
    volume24h: 98_000_000,
    marketCap: 2_800_000_000,
    liquidity: 42_000_000,
    sparkline: makeSparkline(10, 32, true),
  },
  {
    address: "HZ1JovNiVvGrGs1X9Q8eBm7EiEZoZfEhRnLW92vziLkB",
    name: "Pyth Network",
    symbol: "PYTH",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/HZ1JovNiVvGrGs1X9Q8eBm7EiEZoZfEhRnLW92vziLkB/logo.png",
    price: 0.38,
    priceChange24h: -2.1,
    volume24h: 42_000_000,
    marketCap: 560_000_000,
    liquidity: 18_000_000,
    sparkline: makeSparkline(11, 32, false),
  },
  {
    address: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
    name: "Orca",
    symbol: "ORCA",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE/logo.png",
    price: 3.84,
    priceChange24h: 5.2,
    volume24h: 21_000_000,
    marketCap: 385_000_000,
    liquidity: 14_000_000,
    sparkline: makeSparkline(12, 32, true),
  },
  {
    address: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    name: "Raydium",
    symbol: "RAY",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png",
    price: 4.12,
    priceChange24h: 3.7,
    volume24h: 48_000_000,
    marketCap: 621_000_000,
    liquidity: 22_000_000,
    sparkline: makeSparkline(13, 32, true),
  },
  {
    address: "EchesyfXePKdLtoiZSL8ppeVkXof3sUjOTqcQCjkAtTZ",
    name: "Bonfida",
    symbol: "FIDA",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EchesyfXePKdLtoiZSL8ppeVkXof3sUjOTqcQCjkAtTZ/logo.png",
    price: 0.32,
    priceChange24h: -5.1,
    volume24h: 8_000_000,
    marketCap: 71_000_000,
    liquidity: 3_000_000,
    sparkline: makeSparkline(14, 32, false),
  },
  {
    address: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
    name: "Marinade staked SOL",
    symbol: "mSOL",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png",
    price: 192.50,
    priceChange24h: 4.3,
    volume24h: 18_000_000,
    marketCap: 890_000_000,
    liquidity: 35_000_000,
    sparkline: makeSparkline(15, 32, true),
  },
  {
    address: "StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Xjdsc8sDMx",
    name: "Step Finance",
    symbol: "STEP",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Xjdsc8sDMx/logo.png",
    price: 0.089,
    priceChange24h: 12.8,
    volume24h: 6_500_000,
    marketCap: 44_000_000,
    liquidity: 2_000_000,
    sparkline: makeSparkline(16, 32, true),
  },
  {
    address: "ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx",
    name: "Star Atlas",
    symbol: "ATLAS",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx/logo.png",
    price: 0.0041,
    priceChange24h: 7.3,
    volume24h: 4_200_000,
    marketCap: 82_000_000,
    liquidity: 3_000_000,
    sparkline: makeSparkline(17, 32, true),
  },
  {
    address: "MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac",
    name: "Mango",
    symbol: "MNGO",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac/logo.png",
    price: 0.017,
    priceChange24h: -3.4,
    volume24h: 3_100_000,
    marketCap: 51_000_000,
    liquidity: 1_800_000,
    sparkline: makeSparkline(18, 32, false),
  },
  {
    address: "85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ",
    name: "Wormhole",
    symbol: "W",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ/logo.png",
    price: 0.51,
    priceChange24h: 6.9,
    volume24h: 76_000_000,
    marketCap: 510_000_000,
    liquidity: 28_000_000,
    sparkline: makeSparkline(19, 32, true),
  },
  {
    address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    name: "Samoyedcoin",
    symbol: "SAMO",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU/logo.png",
    price: 0.022,
    priceChange24h: 9.1,
    volume24h: 9_800_000,
    marketCap: 88_000_000,
    liquidity: 4_000_000,
    sparkline: makeSparkline(20, 32, true),
  },
];

export const MOCK_HOLDINGS: Holding[] = [
  { token: MOCK_TOKENS[0], balance: 42.18, value: 42.18 * MOCK_TOKENS[0].price },
  {
    token: MOCK_TOKENS[1],
    balance: 120_000_000,
    value: 120_000_000 * MOCK_TOKENS[1].price,
  },
  { token: MOCK_TOKENS[2], balance: 410, value: 410 * MOCK_TOKENS[2].price },
  { token: MOCK_TOKENS[3], balance: 1820, value: 1820 * MOCK_TOKENS[3].price },
  { token: MOCK_TOKENS[4], balance: 640, value: 640 * MOCK_TOKENS[4].price },
];

export function mockNetWorth(): number {
  return MOCK_HOLDINGS.reduce((a, h) => a + h.value, 0);
}

export function mockNetWorthSeries(): number[] {
  return makeSparkline(99, 48, true).map((v) => (v / 100) * mockNetWorth());
}

export const MOCK_ACTIVITY: Activity[] = Array.from({ length: 24 }).map((_, i) => {
  const t = MOCK_TOKENS[i % MOCK_TOKENS.length];
  const buy = i % 3 !== 0;
  return {
    id: `act-${i}`,
    type: buy ? "buy" : "sell",
    token: { symbol: t.symbol, address: t.address, logoURI: t.logoURI },
    amountToken: Math.round((1000 / t.price) * (1 + (i % 5))),
    amountUsd: 80 + i * 37.5,
    txHash: `${t.symbol.toLowerCase()}${(i * 7919).toString(16)}deadbeefcafe${i}`,
    timestamp: Date.now() - i * 1000 * 60 * (7 + (i % 11)),
  };
});

export function mockTradePrints(count = 14): TradePrint[] {
  return Array.from({ length: count }).map((_, i) => {
    const buy = Math.random() > 0.5;
    return {
      id: `print-${Date.now()}-${i}`,
      side: buy ? "buy" : "sell",
      amountUsd: Math.round(50 + Math.random() * 4000),
      price: 1 + Math.random() * 0.04,
      maker: Math.random().toString(36).slice(2, 6) + "..." + Math.random().toString(36).slice(2, 6),
      timestamp: Date.now() - i * 1400,
    };
  });
}

export function mockHolders(): Holder[] {
  let remaining = 62;
  return Array.from({ length: 20 }).map((_, i) => {
    const pct = i === 0 ? 8.4 : Math.max(0.4, remaining / (22 - i) + (Math.random() - 0.5));
    remaining -= pct;
    return {
      address:
        Math.random().toString(36).slice(2, 6) + "..." + Math.random().toString(36).slice(2, 6),
      pct: Number(pct.toFixed(2)),
      amount: Math.round(pct * 1_000_000),
    };
  });
}

/** Mock OHLCV-ish line data for charts (lightweight-charts expects {time, value}). */
export function mockChartSeries(days = 90, seed = 7): { time: number; value: number }[] {
  const rnd = seeded(seed);
  const out: { time: number; value: number }[] = [];
  let time = Math.floor(Date.now() / 1000) - days * 86400;
  let value = 100;
  for (let i = 0; i < days; i++) {
    value = Math.max(2, value + (rnd() - 0.46) * 6);
    out.push({ time, value: Number(value.toFixed(3)) });
    time += 86400;
  }
  return out;
}
