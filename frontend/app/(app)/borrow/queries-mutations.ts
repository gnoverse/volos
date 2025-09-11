import { getAPRHistory, getBorrowHistory, getCollateralSupplyHistory, getMarket, getMarketActivity, getMarkets, getMarketSnapshots, getSupplyHistory, getUserLoanHistory, getUserMarketPosition, getUtilizationHistory } from "@/app/services/api.service";
import { TxService, VOLOS_ADDRESS } from "@/app/services/tx.service";
import {  Market, Position } from "@/app/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const marketsQueryKey = ["markets"];
export const marketQueryKey = (marketId: string) => ["market", marketId];
export const marketHistoryQueryKey = (marketId: string) => ["marketHistory", marketId];
export const positionQueryKey = (marketId: string, user: string) => ["position", marketId, user];
export const netSupplyHistoryQueryKey = (marketId: string) => ["netSupplyHistory", marketId];
export const netBorrowHistoryQueryKey = (marketId: string) => ["netBorrowHistory", marketId];
export const collateralSupplyHistoryQueryKey = (marketId: string) => ["collateralSupplyHistory", marketId];
export const utilizationHistoryQueryKey = (marketId: string) => ["utilizationHistory", marketId];
export const aprHistoryQueryKey = (marketId: string) => ["aprHistory", marketId];
export const marketSnapshotsQueryKey = (marketId: string) => ["marketSnapshots", marketId];
export const marketActivityQueryKey = (marketId: string) => ["marketActivity", marketId];
export const userLoanHistoryQueryKey = (userAddress: string) => ["userLoanHistory", userAddress];

export function useMarketsQuery() {
  return useQuery({
    queryKey: marketsQueryKey,
    queryFn: async (): Promise<Market[]> => {
      const response = await getMarkets();
      return response.markets;
    },
  });
}

export function useUserLoanHistoryQuery(userAddress: string) {
  return useQuery({
    queryKey: userLoanHistoryQueryKey(userAddress),
    queryFn: () => getUserLoanHistory(userAddress),
    enabled: !!userAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMarketQuery(marketId: string) {
  return useQuery({
    queryKey: marketQueryKey(marketId),
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
    queryKey: positionQueryKey(marketId, user),
    queryFn: () => getUserMarketPosition(user, marketId),
    enabled: !!marketId && !!user,
    staleTime: 60 * 1000,
  });
}

// History queries (for 1 week period)
export function useNetSupplyHistoryQuery(marketId: string, startTime?: string, endTime?: string) {
  return useQuery({
    queryKey: [...netSupplyHistoryQueryKey(marketId), startTime, endTime],
    queryFn: () => getSupplyHistory(marketId, startTime, endTime),
    enabled: !!marketId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // refetchInterval: 2000, //TODO: REMOVE POLLING, SWITCH TO WEBSOCKETS 
    // refetchIntervalInBackground: true,
  });
}

export function useNetBorrowHistoryQuery(marketId: string, startTime?: string, endTime?: string) {
  return useQuery({
    queryKey: [...netBorrowHistoryQueryKey(marketId), startTime, endTime],
    queryFn: () => getBorrowHistory(marketId, startTime, endTime),
    enabled: !!marketId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // refetchInterval: 2000, //TODO: REMOVE POLLING, SWITCH TO WEBSOCKETS 
    // refetchIntervalInBackground: true,
  });
}

export function useCollateralSupplyHistoryQuery(marketId: string, startTime?: string, endTime?: string) {
  return useQuery({
    queryKey: [...collateralSupplyHistoryQueryKey(marketId), startTime, endTime],
    queryFn: () => getCollateralSupplyHistory(marketId, startTime, endTime),
    enabled: !!marketId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // refetchInterval: 2000, //TODO: REMOVE POLLING, SWITCH TO WEBSOCKETS 
    // refetchIntervalInBackground: true,
  });
}

export function useUtilizationHistoryQuery(marketId: string, startTime?: string, endTime?: string) {
  return useQuery({
    queryKey: [...utilizationHistoryQueryKey(marketId), startTime, endTime],
    queryFn: () => getUtilizationHistory(marketId, startTime, endTime),
    enabled: !!marketId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // refetchInterval: 2000, //TODO: REMOVE POLLING, SWITCH TO WEBSOCKETS 
    // refetchIntervalInBackground: true,
  });
}

export function useAPRHistoryQuery(marketId: string, startTime?: string, endTime?: string) {
  return useQuery({
    queryKey: [...aprHistoryQueryKey(marketId), startTime, endTime],
    queryFn: () => getAPRHistory(marketId, startTime, endTime),
    enabled: !!marketId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // refetchInterval: 2000, //TODO: REMOVE POLLING, SWITCH TO WEBSOCKETS 
    // refetchIntervalInBackground: true,
  });
}

export function useMarketActivityQuery(marketId: string, limit?: number, lastId?: string) {
  return useQuery({
    queryKey: [...marketActivityQueryKey(marketId), limit, lastId],
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
    queryKey: [...marketSnapshotsQueryKey(marketId), resolution, startTime, endTime],
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
        queryClient.invalidateQueries({ queryKey: positionQueryKey(variables.marketId, variables.userAddress), refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: marketQueryKey(variables.marketId), refetchType: 'active' }),
      ]);
    },
    onError: (error) => {
      console.error("Supply transaction failed:", error);
    },
    onSettled: (data, error, variables) => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: positionQueryKey(variables.marketId, variables.userAddress) });
        queryClient.invalidateQueries({ queryKey: marketQueryKey(variables.marketId) });
      }, 1500);
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
        queryClient.invalidateQueries({ queryKey: positionQueryKey(variables.marketId, variables.userAddress), refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: marketQueryKey(variables.marketId), refetchType: 'active' }),
      ]);
    },
    onError: (error) => {
      console.error("Withdraw transaction failed:", error);
    },
    onSettled: (data, error, variables) => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: positionQueryKey(variables.marketId, variables.userAddress) });
        queryClient.invalidateQueries({ queryKey: marketQueryKey(variables.marketId) });
      }, 1500);
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
        queryClient.invalidateQueries({ queryKey: positionQueryKey(variables.marketId, variables.userAddress), refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: marketQueryKey(variables.marketId), refetchType: 'active' }),
      ]);
    },
    onError: (error) => {
      console.error("Borrow transaction failed:", error);
    },
    onSettled: (data, error, variables) => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: positionQueryKey(variables.marketId, variables.userAddress) });
        queryClient.invalidateQueries({ queryKey: marketQueryKey(variables.marketId) });
      }, 1500);
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
        queryClient.invalidateQueries({ queryKey: positionQueryKey(variables.marketId, variables.userAddress), refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: marketQueryKey(variables.marketId), refetchType: 'active' }),
      ]);
    },
    onError: (error) => {
      console.error("Repay transaction failed:", error);
    },
    onSettled: (data, error, variables) => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: positionQueryKey(variables.marketId, variables.userAddress) });
        queryClient.invalidateQueries({ queryKey: marketQueryKey(variables.marketId) });
      }, 1500);
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
        queryClient.invalidateQueries({ queryKey: positionQueryKey(variables.marketId, variables.userAddress), refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: marketQueryKey(variables.marketId), refetchType: 'active' }),
      ]);
    },
    onError: (error) => {
      console.error("Supply collateral transaction failed:", error);
    },
    onSettled: (data, error, variables) => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: positionQueryKey(variables.marketId, variables.userAddress) });
        queryClient.invalidateQueries({ queryKey: marketQueryKey(variables.marketId) });
      }, 1500);
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
        queryClient.invalidateQueries({ queryKey: positionQueryKey(variables.marketId, variables.userAddress), refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: marketQueryKey(variables.marketId), refetchType: 'active' }),
      ]);
    },
    onError: (error) => {
      console.error("Withdraw collateral transaction failed:", error);
    },
    onSettled: (data, error, variables) => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: positionQueryKey(variables.marketId, variables.userAddress) });
        queryClient.invalidateQueries({ queryKey: marketQueryKey(variables.marketId) });
      }, 1500);
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
      await queryClient.cancelQueries({ queryKey: marketQueryKey(variables.marketId) });
      const previousMarketData = queryClient.getQueryData(marketQueryKey(variables.marketId));
      return { previousMarketData };
    },
    onError: (error, variables, context) => {
      if (context?.previousMarketData) {
        queryClient.setQueryData(marketQueryKey(variables.marketId), context.previousMarketData);
      }
      console.error("Liquidate transaction failed:", error);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: marketQueryKey(variables.marketId) });
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
      await queryClient.cancelQueries({ queryKey: marketQueryKey(variables.marketId) });
      const previousMarketData = queryClient.getQueryData(marketQueryKey(variables.marketId));
      return { previousMarketData };
    },
    onError: (error, variables, context) => {
      if (context?.previousMarketData) {
        queryClient.setQueryData(marketQueryKey(variables.marketId), context.previousMarketData);
      }
      console.error("Accrue interest transaction failed:", error);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: marketQueryKey(variables.marketId) });
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
      await queryClient.cancelQueries({ queryKey: marketsQueryKey });
      const previousMarketsData = queryClient.getQueryData(marketsQueryKey);
      return { previousMarketsData };
    },
    onError: (error, variables, context) => {
      if (context?.previousMarketsData) {
        queryClient.setQueryData(marketsQueryKey, context.previousMarketsData);
      }
      console.error("Create market transaction failed:", error);
    },
    onSettled: (data, error) => {
      queryClient.invalidateQueries({ queryKey: marketsQueryKey });
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
      queryClient.invalidateQueries({ queryKey: marketsQueryKey });
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
      queryClient.invalidateQueries({ queryKey: marketsQueryKey });
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
      queryClient.invalidateQueries({ queryKey: marketsQueryKey });
      if (error) {
        console.error("Set fee recipient transaction failed:", error);
      } else {
        console.log("Set fee recipient transaction successful:", data);
      }
    }
  });
}
