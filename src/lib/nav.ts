import { Wallet, TrendingUp, CandlestickChart, Activity } from "lucide-react";

export const NAV_ITEMS = [
  { label: "Portfolio", href: "/", icon: Wallet },
  { label: "Markets", href: "/trending", icon: TrendingUp },
  {
    label: "Trade",
    href: "/trade/So11111111111111111111111111111111111111112",
    icon: CandlestickChart,
    match: "/trade",
  },
  { label: "Activity", href: "/activity", icon: Activity },
] as const;
