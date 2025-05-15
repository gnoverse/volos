import { apiListMarketsInfo } from "@/app/services/query-funcs/query";
import { MarketInfo } from "@/app/services/types";
import { useQuery } from "@tanstack/react-query";

export const marketsQueryKey = ["markets"];

export function useMarketsQuery() {
  return useQuery({
    queryKey: marketsQueryKey,
    queryFn: async (): Promise<MarketInfo[]> => {
      const response = await apiListMarketsInfo();
      
      // Transform the response to match our expected format
      const marketsWithParams: MarketInfo[] = [];
      
      for (const marketWrapper of response.markets) {
        for (const marketInfo of Object.values(marketWrapper)) {
          marketsWithParams.push(marketInfo);
        }
      }
      
      return marketsWithParams;
    },
  });
} 