import { getAllMarketsWithParams } from "@/app/services/query-funcs/query";
import { useQuery } from "@tanstack/react-query";

export const marketsQueryKey = ["markets"];

export function useMarketsQuery() {
  return useQuery({
    queryKey: marketsQueryKey,
    queryFn: getAllMarketsWithParams,
  });
} 