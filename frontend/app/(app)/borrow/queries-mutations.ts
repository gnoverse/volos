import { getAPRHistory, getBorrowHistory, getCollateralSupplyHistory, getMarket, getMarketActivity, getMarkets, getMarketSnapshots, getSupplyHistory, getUserLoanHistory, getUserMarketPosition, getUtilizationHistory } from "@/app/services/api.service";
import { TxService, VOLOS_ADDRESS } from "@/app/services/tx.service";
import { Market, Position } from "@/app/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const MARKETS_QUERY_KEY = 'markets';
export const MARKET_QUERY_KEY = 'market';
export const MARKET_HISTORY_QUERY_KEY = 'marketHistory';
export const POSITION_QUERY_KEY = 'position';
export const NET_SUPPLY_HISTORY_QUERY_KEY = 'netSupplyHistory';
export const NET_BORROW_HISTORY_QUERY_KEY = 'netBorrowHistory';
export const COLLATERAL_SUPPLY_HISTORY_QUERY_KEY = 'collateralSupplyHistory';
export const UTILIZATION_HISTORY_QUERY_KEY = 'utilizationHistory';
export const APR_HISTORY_QUERY_KEY = 'aprHistory';
export const MARKET_SNAPSHOTS_QUERY_KEY = 'marketSnapshots';
export const MARKET_ACTIVITY_QUERY_KEY = 'marketActivity';
export const USER_LOAN_HISTORY_QUERY_KEY = 'userLoanHistory';

export function useMarketsQuery() {
  return useQuery({
    queryKey: [MARKETS_QUERY_KEY],
    queryFn: async (): Promise<Market[]> => {
      const response = await getMarkets();
      return response.markets;
    },
  });
}

export function useUserLoanHistoryQuery(userAddress: string) {
  return useQuery({
    queryKey: [USER_LOAN_HISTORY_QUERY_KEY, userAddress],
    queryFn: () => getUserLoanHistory(userAddress),
    enabled: !!userAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMarketQuery(marketId: string) {
  return useQuery({
    queryKey: [MARKET_QUERY_KEY, marketId],
    queryFn: async (): Promise<Market> => {
      return await getMarket(marketId);
    },
    enabled: !!marketId,
    // refetchInterval: 2000, //TODO: REMOVE POLLING, SWITCH TO WEBSOCKETS 
    // refetchIntervalInBackground: true,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePositionQuery(marketId: string, user: string) {
  return useQuery<Position>({
    queryKey: [POSITION_QUERY_KEY, marketId, user],
    queryFn: () => getUserMarketPosition(user, marketId),
    enabled: !!marketId && !!user,
    staleTime: 60 * 1000,
  });
}

// History queries (for 1 week period)
export function useNetSupplyHistoryQuery(marketId: string, startTime?: string, endTime?: string) {
  return useQuery({
    queryKey: [NET_SUPPLY_HISTORY_QUERY_KEY, marketId, startTime, endTime],
    queryFn: () => getSupplyHistory(marketId, startTime, endTime),
    enabled: !!marketId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // refetchInterval: 2000, //TODO: REMOVE POLLING, SWITCH TO WEBSOCKETS 
    // refetchIntervalInBackground: true,
  });
}

export function useNetBorrowHistoryQuery(marketId: string, startTime?: string, endTime?: string) {
  return useQuery({
    queryKey: [NET_BORROW_HISTORY_QUERY_KEY, marketId, startTime, endTime],
    queryFn: () => getBorrowHistory(marketId, startTime, endTime),
    enabled: !!marketId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // refetchInterval: 2000, //TODO: REMOVE POLLING, SWITCH TO WEBSOCKETS 
    // refetchIntervalInBackground: true,
  });
}

export function useCollateralSupplyHistoryQuery(marketId: string, startTime?: string, endTime?: string) {
  return useQuery({
    queryKey: [COLLATERAL_SUPPLY_HISTORY_QUERY_KEY, marketId, startTime, endTime],
    queryFn: () => getCollateralSupplyHistory(marketId, startTime, endTime),
    enabled: !!marketId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // refetchInterval: 2000, //TODO: REMOVE POLLING, SWITCH TO WEBSOCKETS 
    // refetchIntervalInBackground: true,
  });
}

export function useUtilizationHistoryQuery(marketId: string, startTime?: string, endTime?: string) {
  return useQuery({
    queryKey: [UTILIZATION_HISTORY_QUERY_KEY, marketId, startTime, endTime],
    queryFn: () => getUtilizationHistory(marketId, startTime, endTime),
    enabled: !!marketId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // refetchInterval: 2000, //TODO: REMOVE POLLING, SWITCH TO WEBSOCKETS 
    // refetchIntervalInBackground: true,
  });
}

export function useAPRHistoryQuery(marketId: string, startTime?: string, endTime?: string) {
  return useQuery({
    queryKey: [APR_HISTORY_QUERY_KEY, marketId, startTime, endTime],
    queryFn: () => getAPRHistory(marketId, startTime, endTime),
    enabled: !!marketId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // refetchInterval: 2000, //TODO: REMOVE POLLING, SWITCH TO WEBSOCKETS 
    // refetchIntervalInBackground: true,
  });
}

export function useMarketActivityQuery(marketId: string, limit?: number, lastId?: string) {
  return useQuery({
    queryKey: [MARKET_ACTIVITY_QUERY_KEY, marketId, limit, lastId],
    queryFn: () => getMarketActivity(marketId, limit, lastId),
    enabled: !!marketId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Snapshot queries for different resolutions
export function useMarketSnapshotsQuery(
  marketId: string, 
  resolution: '4hour' | 'daily' | 'weekly',
  startTime?: string,
  endTime?: string
) {
  return useQuery({
    queryKey: [MARKET_SNAPSHOTS_QUERY_KEY, marketId, resolution, startTime, endTime],
    queryFn: () => getMarketSnapshots(marketId, resolution, startTime, endTime),
    enabled: !!marketId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// mutations ------------------------------------------------------------

export function useApproveTokenMutation() {
  const txService = TxService.getInstance();
  
  return useMutation({
    mutationFn: async ({ 
      tokenPath, 
      amount 
    }: { 
      tokenPath: string; 
      amount: number;
    }) => {
      const response = await txService.approveToken(tokenPath, amount, VOLOS_ADDRESS);
      
      if (response.status === 'failure') {
        throw new Error(`Token approval failed: ${response.message || 'Unknown error'}`);
      }
      
      return response;
    },
    onError: (error) => {
      console.error("Token approval failed:", error);
    },
    onSuccess: (data) => {
      console.log("Token approval successful:", data);
    }
  });
}

export function useSupplyMutation() {
  const queryClient = useQueryClient();
  const txService = TxService.getInstance();
  
  return useMutation({
    mutationFn: async ({ 
      marketId, 
      assets, 
      shares = 0 
    }: { 
      marketId: string; 
      userAddress: string;
      assets: number; 
      shares?: number;
    }) => {
      return txService.supply(marketId, assets, shares);
    },
    onMutate: async (variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [POSITION_QUERY_KEY, variables.marketId, variables.userAddress], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: [MARKET_QUERY_KEY, variables.marketId], refetchType: 'active' }),
      ]);
    },
    onError: (error) => {
      console.error("Supply transaction failed:", error);
    },
    onSettled: (data, error, variables) => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [POSITION_QUERY_KEY, variables.marketId, variables.userAddress] });
        queryClient.invalidateQueries({ queryKey: [MARKET_QUERY_KEY, variables.marketId] });
      }, 2000);
    }
  });
}

export function useWithdrawMutation() {
  const queryClient = useQueryClient();
  const txService = TxService.getInstance();
  
  return useMutation({
    mutationFn: async ({ 
      marketId, 
      assets, 
      shares = 0 
    }: { 
      marketId: string; 
      userAddress: string;
      assets: number; 
      shares?: number;
    }) => {
      return txService.withdraw(marketId, assets, shares);
    },
    onMutate: async (variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [POSITION_QUERY_KEY, variables.marketId, variables.userAddress], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: [MARKET_QUERY_KEY, variables.marketId], refetchType: 'active' }),
      ]);
    },
    onError: (error) => {
      console.error("Withdraw transaction failed:", error);
    },
    onSettled: (data, error, variables) => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [POSITION_QUERY_KEY, variables.marketId, variables.userAddress] });
        queryClient.invalidateQueries({ queryKey: [MARKET_QUERY_KEY, variables.marketId] });
      }, 2000);
    }
  });
}

export function useBorrowMutation() {
  const queryClient = useQueryClient();
  const txService = TxService.getInstance();
  
  return useMutation({
    mutationFn: async ({ 
      marketId, 
      assets, 
      shares = 0 
    }: { 
      marketId: string; 
      userAddress: string;
      assets: number; 
      shares?: number;
    }) => {
      return txService.borrow(marketId, assets, shares);
    },
    onMutate: async (variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [POSITION_QUERY_KEY, variables.marketId, variables.userAddress], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: [MARKET_QUERY_KEY, variables.marketId], refetchType: 'active' }),
      ]);
    },
    onError: (error) => {
      console.error("Borrow transaction failed:", error);
    },
    onSettled: (data, error, variables) => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [POSITION_QUERY_KEY, variables.marketId, variables.userAddress] });
        queryClient.invalidateQueries({ queryKey: [MARKET_QUERY_KEY, variables.marketId] });
      }, 2000);
    }
  });
}

export function useRepayMutation() {
  const queryClient = useQueryClient();
  const txService = TxService.getInstance();
  
  return useMutation({
    mutationFn: async ({ 
      marketId, 
      assets, 
      shares = 0 
    }: { 
      marketId: string; 
      userAddress: string;
      assets: number; 
      shares?: number;
    }) => {
      return txService.repay(marketId, assets, shares);
    },
    onMutate: async (variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [POSITION_QUERY_KEY, variables.marketId, variables.userAddress], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: [MARKET_QUERY_KEY, variables.marketId], refetchType: 'active' }),
      ]);
    },
    onError: (error) => {
      console.error("Repay transaction failed:", error);
    },
    onSettled: (data, error, variables) => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [POSITION_QUERY_KEY, variables.marketId, variables.userAddress] });
        queryClient.invalidateQueries({ queryKey: [MARKET_QUERY_KEY, variables.marketId] });
      }, 2000);
    }
  });
}

export function useSupplyCollateralMutation() {
  const queryClient = useQueryClient();
  const txService = TxService.getInstance();
  
  return useMutation({
    mutationFn: async ({ 
      marketId, 
      amount 
    }: { 
      marketId: string; 
      userAddress: string;
      amount: number;
    }) => {
      return txService.supplyCollateral(marketId, amount);
    },
    onMutate: async (variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [POSITION_QUERY_KEY, variables.marketId, variables.userAddress], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: [MARKET_QUERY_KEY, variables.marketId], refetchType: 'active' }),
      ]);
    },
    onError: (error) => {
      console.error("Supply collateral transaction failed:", error);
    },
    onSettled: (data, error, variables) => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [POSITION_QUERY_KEY, variables.marketId, variables.userAddress] });
        queryClient.invalidateQueries({ queryKey: [MARKET_QUERY_KEY, variables.marketId] });
      }, 2000);
    }
  });
}

export function useWithdrawCollateralMutation() {
  const queryClient = useQueryClient();
  const txService = TxService.getInstance();
  
  return useMutation({
    mutationFn: async ({ 
      marketId, 
      amount 
    }: { 
      marketId: string; 
      userAddress: string;
      amount: number;
    }) => {
      return txService.withdrawCollateral(marketId, amount);
    },
    onMutate: async (variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [POSITION_QUERY_KEY, variables.marketId, variables.userAddress], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: [MARKET_QUERY_KEY, variables.marketId], refetchType: 'active' }),
      ]);
    },
    onError: (error) => {
      console.error("Withdraw collateral transaction failed:", error);
    },
    onSettled: (data, error, variables) => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [POSITION_QUERY_KEY, variables.marketId, variables.userAddress] });
        queryClient.invalidateQueries({ queryKey: [MARKET_QUERY_KEY, variables.marketId] });
      }, 2000);
    }
  });
}

export function useLiquidateMutation() {
  const queryClient = useQueryClient();
  const txService = TxService.getInstance();
  
  return useMutation({
    mutationFn: async ({ 
      marketId, 
      borrower,
      seizedAssets = 0,
      repaidShares = 0
    }: { 
      marketId: string; 
      borrower: string;
      seizedAssets?: number;
      repaidShares?: number;
    }) => {
      return txService.liquidate(marketId, borrower, seizedAssets, repaidShares);
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: [MARKET_QUERY_KEY, variables.marketId] });
      const previousMarketData = queryClient.getQueryData([MARKET_QUERY_KEY, variables.marketId]);
      return { previousMarketData };
    },
    onError: (error, variables, context) => {
      if (context?.previousMarketData) {
        queryClient.setQueryData([MARKET_QUERY_KEY, variables.marketId], context.previousMarketData);
      }
      console.error("Liquidate transaction failed:", error);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: [MARKET_QUERY_KEY, variables.marketId] });
      if (!error) {
        console.log("Liquidate transaction successful:", data);
      }
    }
  });
}

export function useAccrueInterestMutation() {
  const queryClient = useQueryClient();
  const txService = TxService.getInstance();
  
  return useMutation({
    mutationFn: async ({ 
      marketId
    }: { 
      marketId: string;
    }) => {
      return txService.accrueInterest(marketId);
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: [MARKET_QUERY_KEY, variables.marketId] });
      const previousMarketData = queryClient.getQueryData([MARKET_QUERY_KEY, variables.marketId]);
      return { previousMarketData };
    },
    onError: (error, variables, context) => {
      if (context?.previousMarketData) {
        queryClient.setQueryData([MARKET_QUERY_KEY, variables.marketId], context.previousMarketData);
      }
      console.error("Accrue interest transaction failed:", error);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: [MARKET_QUERY_KEY, variables.marketId] });
      if (!error) {
        console.log("Accrue interest transaction successful:", data);
      }
    }
  });
}

export function useCreateMarketMutation() {
  const queryClient = useQueryClient();
  const txService = TxService.getInstance();
  
  return useMutation({
    mutationFn: async ({ 
      marketId,
      isToken0Loan,
      irm,
      lltv
    }: { 
      marketId: string;
      isToken0Loan: boolean;
      irm: string;
      lltv: number;
    }) => {
      return txService.createMarket(marketId, isToken0Loan, irm, lltv);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: [MARKETS_QUERY_KEY] });
      const previousMarketsData = queryClient.getQueryData([MARKETS_QUERY_KEY]);
      return { previousMarketsData };
    },
    onError: (error, variables, context) => {
      if (context?.previousMarketsData) {
        queryClient.setQueryData([MARKETS_QUERY_KEY], context.previousMarketsData);
      }
      console.error("Create market transaction failed:", error);
    },
    onSettled: (data, error) => {
      queryClient.invalidateQueries({ queryKey: [MARKETS_QUERY_KEY] });
      if (!error) {
        console.log("Create market transaction successful:", data);
      }
    }
  });
}

export function useEnableIRMMutation() {
  const queryClient = useQueryClient();
  const txService = TxService.getInstance();
  
  return useMutation({
    mutationFn: async ({ 
      irm
    }: { 
      irm: string;
    }) => {
      return txService.enableIRM(irm);
    },
    onSettled: (data, error) => {
      queryClient.invalidateQueries({ queryKey: [MARKETS_QUERY_KEY] });
      if (error) {
        console.error("Enable IRM transaction failed:", error);
      } else {
        console.log("Enable IRM transaction successful:", data);
      }
    }
  });
}
export function useEnableLLTVMutation() {
  const queryClient = useQueryClient();
  const txService = TxService.getInstance();
  
  return useMutation({
    mutationFn: async ({ 
      lltv
    }: { 
      lltv: string;
    }) => {
      return txService.enableLLTV(lltv);
    },
    onSettled: (data, error) => {
      queryClient.invalidateQueries({ queryKey: [MARKETS_QUERY_KEY] });
      if (error) {
        console.error("Enable LLTV transaction failed:", error);
      } else {
        console.log("Enable LLTV transaction successful:", data);
      }
    }
  });
}
export function useSetFeeRecipientMutation() {
  const queryClient = useQueryClient();
  const txService = TxService.getInstance();
  
  return useMutation({
    mutationFn: async ({ 
      address
    }: { 
      address: string;
    }) => {
      return txService.setFeeRecipient(address);
    },
    onSettled: (data, error) => {
      queryClient.invalidateQueries({ queryKey: [MARKETS_QUERY_KEY] });
      if (error) {
        console.error("Set fee recipient transaction failed:", error);
      } else {
        console.log("Set fee recipient transaction successful:", data);
      }
    }
  });
}
