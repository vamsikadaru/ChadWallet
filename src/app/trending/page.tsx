import { getTrendingTokens } from "@/lib/birdeye";
import TrendingView from "@/components/trending/TrendingView";

export const revalidate = 30;

export default async function TrendingPage() {
  const tokens = await getTrendingTokens();
  return <TrendingView initial={tokens} />;
}
