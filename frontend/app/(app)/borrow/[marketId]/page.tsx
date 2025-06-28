// Server Component - no "use client"
import { MarketPageClient } from './client-page';

export default async function MarketPage({ params }: { params: { marketId: string } }) {
  const decodedMarketId = decodeURIComponent(params.marketId);
  
  // TODO: Add server-side calculations here
  // - Fetch market data from indexer
  // - Calculate market statistics (total supply, borrow, utilization, etc.)
  // - Process activity data (format types, calculate averages, etc.)
  // - Pass calculated data to client component as props
  
  return (
    <MarketPageClient 
      marketId={decodedMarketId}
    />
  );
}
