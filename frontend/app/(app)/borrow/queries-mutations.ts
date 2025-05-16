import { apiGetMarketInfo, apiListMarketsInfo } from "@/app/services/abci";
import { TxService } from "@/app/services/tx.service";
import { MarketInfo } from "@/app/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
      return txService.approveToken(tokenPath, amount);
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
      assets: number; 
      shares?: number;
    }) => {
      return txService.supply(marketId, assets, shares);
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
      console.error("Supply transaction failed:", error);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: marketQueryKey(variables.marketId) });
      if (!error) {
        console.log("Supply transaction successful:", data);
      }
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
      assets: number; 
      shares?: number;
    }) => {
      return txService.withdraw(marketId, assets, shares);
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
      console.error("Withdraw transaction failed:", error);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: marketQueryKey(variables.marketId) });
      if (!error) {
        console.log("Withdraw transaction successful:", data);
      }
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
      assets: number; 
      shares?: number;
    }) => {
      return txService.borrow(marketId, assets, shares);
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
      console.error("Borrow transaction failed:", error);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: marketQueryKey(variables.marketId) });
      if (!error) {
        console.log("Borrow transaction successful:", data);
      }
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
      assets: number; 
      shares?: number;
    }) => {
      return txService.repay(marketId, assets, shares);
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
      console.error("Repay transaction failed:", error);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: marketQueryKey(variables.marketId) });
      if (!error) {
        console.log("Repay transaction successful:", data);
      }
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
      amount: number;
    }) => {
      return txService.supplyCollateral(marketId, amount);
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
      console.error("Supply collateral transaction failed:", error);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: marketQueryKey(variables.marketId) });
      if (!error) {
        console.log("Supply collateral transaction successful:", data);
      }
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
      amount: number;
    }) => {
      return txService.withdrawCollateral(marketId, amount);
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
      console.error("Withdraw collateral transaction failed:", error);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: marketQueryKey(variables.marketId) });
      if (!error) {
        console.log("Withdraw collateral transaction successful:", data);
      }
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
      poolPath,
      isToken0Loan,
      irm,
      lltv
    }: { 
      poolPath: string;
      isToken0Loan: boolean;
      irm: string;
      lltv: number;
    }) => {
      return txService.createMarket(poolPath, isToken0Loan, irm, lltv);
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
