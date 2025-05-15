import { apiListMarketsInfo } from "@/app/services/query-funcs/query";
import { MarketInfo } from "@/app/services/types";
import { useQuery } from "@tanstack/react-query";

export const marketsQueryKey = ["markets"];

export function useMarketsQuery() {
  return useQuery({
    queryKey: marketsQueryKey,
    queryFn: async (): Promise<MarketInfo[]> => {
      const marketsArray = await apiListMarketsInfo();
      
      const markets: MarketInfo[] = [];
      
      for (const marketWrapper of marketsArray) {
        for (const [marketId, marketInfo] of Object.entries(marketWrapper)) {
          // Add marketId to the marketInfo object for reference
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