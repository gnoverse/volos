import { apiGetMarketInfo, apiListMarketsInfo } from "@/app/services/query-funcs/query";
import { MarketInfo } from "@/app/services/types";
import { useQuery } from "@tanstack/react-query";
import { MarketHistory, getHistoryForMarket } from "./mock-history";

export const marketsQueryKey = ["markets"];
export const marketQueryKey = (marketId: string) => ["market", marketId];
export const marketHistoryQueryKey = (marketId: string) => ["marketHistory", marketId];

export function useMarketsQuery() {
  return useQuery({
    queryKey: marketsQueryKey,
    queryFn: async (): Promise<MarketInfo[]> => {
      const marketsArray = await apiListMarketsInfo();
      
      const markets: MarketInfo[] = [];
      
      for (const marketWrapper of marketsArray) {
        for (const [marketId, marketInfo] of Object.entries(marketWrapper)) {
          markets.push({
            ...marketInfo,
            marketId
          });
        }
      }
      
      return markets;
    },
  });
}

export function useMarketQuery(marketId: string) {
  return useQuery({
    queryKey: marketQueryKey(marketId),
    queryFn: async () => {
      const marketInfo = await apiGetMarketInfo(marketId);
      return marketInfo;
    },
    enabled: !!marketId,
  });
}

export function useMarketHistoryQuery(marketId: string) {
  return useQuery({
    queryKey: marketHistoryQueryKey(marketId),
    queryFn: async (): Promise<MarketHistory[]> => {
      return getHistoryForMarket(marketId);
    },
    enabled: !!marketId,
  });
}