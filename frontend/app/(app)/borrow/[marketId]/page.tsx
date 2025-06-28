// server component - SSR
import { apiGetMarketInfo } from '@/app/services/abci';
import { getNetBorrowHistory, getNetSupplyHistory } from '@/app/services/backend/historic';
import { getMarketActivity } from '@/app/services/indexer/historic';
import { getHistoryForMarket } from '../mock-history';
import { MarketPageClient } from './client-page';

export default async function MarketPage({ params }: { params: Promise<{ marketId: string }> }) {
  const { marketId } = await params;
  const decodedMarketId = decodeURIComponent(marketId);
  
  const [marketInfo, mockHistory, netSupplyHistory, netBorrowHistory, marketActivity] = await Promise.all([
    apiGetMarketInfo(decodedMarketId),
    getHistoryForMarket(decodedMarketId), // targeting through backend/historic.ts
    getNetSupplyHistory(decodedMarketId), // targeting through backend/historic.ts
    getNetBorrowHistory(decodedMarketId), // targeting through backend/historic.ts
    getMarketActivity(decodedMarketId) // targeting through indexer/historic.ts directly
  ]);

  const apyVariations = {
    sevenDay: 0,
    ninetyDay: 0
  };
  
  return (
    <MarketPageClient 
      marketId={decodedMarketId}
      marketInfo={marketInfo}
      mockHistory={mockHistory}
      netSupplyHistory={netSupplyHistory}
      netBorrowHistory={netBorrowHistory}
      marketActivity={marketActivity}
      apyVariations={apyVariations}
    />
  );
}
