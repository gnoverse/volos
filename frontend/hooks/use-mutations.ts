import { TxService } from "@/app/services/tx.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { POSITION_QUERY_KEY, MARKET_QUERY_KEY, MARKETS_QUERY_KEY, USER_QUERY_KEY, GOVERNANCE_USER_INFO_QUERY_KEY, USER_PENDING_UNSTAKES_QUERY_KEY, PROPOSAL_QUERY_KEY, PROPOSALS_QUERY_KEY, ACTIVE_PROPOSALS_QUERY_KEY, XVLS_BALANCE_QUERY_KEY, USER_VOTE_QUERY_KEY } from "./use-queries";

export function useApproveTokenMutation() {
    const txService = TxService.getInstance();
    
    return useMutation({
      mutationFn: async ({ 
        tokenPath, 
        amount,
        spenderAddress
      }: { 
        tokenPath: string; 
        amount: number;
        spenderAddress: string;
      }) => {
        return await txService.approveToken(tokenPath, amount, spenderAddress);
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
        console.error(error);
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
        console.error(error);
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
        console.error(error);
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
        console.error(error);
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
        console.error(error);
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
        console.error(error);
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
        console.error(error);
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
        console.error(error);
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
        console.error(error);
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
          console.error(error);
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
          console.error(error);
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
          console.error(error);
        } else {
          console.log("Set fee recipient transaction successful:", data);
        }
      }
    });
  }
  

// governance mutations ------------------------------------------------------------
  
export function useStakeVLSMutation() {
    const txService = TxService.getInstance();
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ 
        amount, 
        delegatee 
      }: { 
        amount: number; 
        delegatee: string; 
      }) => {
        return txService.stakeVLS(amount, delegatee);
      },
      onError: (error) => {
        console.error(error);
      },
      onSuccess: async (data) => {
        console.log("VLS staking successful:", data);
  
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY] }),
          queryClient.invalidateQueries({ queryKey: [GOVERNANCE_USER_INFO_QUERY_KEY] }),
          queryClient.invalidateQueries({ queryKey: [USER_PENDING_UNSTAKES_QUERY_KEY] })
        ]);
        
        setTimeout(async () => {
          await Promise.all([
            queryClient.refetchQueries({ queryKey: [USER_QUERY_KEY] }),
            queryClient.refetchQueries({ queryKey: [USER_PENDING_UNSTAKES_QUERY_KEY] })
          ]);
        }, 1000);
      }
    });
  }
  
export function useBeginUnstakeVLSMutation() {
    const txService = TxService.getInstance();
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: async ({ 
        amount, 
        delegatee 
      }: { 
        amount: number; 
        delegatee: string; 
      }) => {
        return txService.beginUnstakeVLS(amount, delegatee);
      },
      onError: (error) => {
        console.error(error);
      },
      onSuccess: async (data) => {
        console.log("VLS unstaking successful:", data);
        
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY] }),
          queryClient.invalidateQueries({ queryKey: [GOVERNANCE_USER_INFO_QUERY_KEY] }),
          queryClient.invalidateQueries({ queryKey: [USER_PENDING_UNSTAKES_QUERY_KEY] })
        ]);
        
        setTimeout(async () => {
          await Promise.all([
            queryClient.refetchQueries({ queryKey: [USER_QUERY_KEY] }),
            queryClient.refetchQueries({ queryKey: [USER_PENDING_UNSTAKES_QUERY_KEY] })
          ]);
        }, 1000);
      }
    });
  }
  
  export function useWithdrawUnstakedVLSMutation() {
    const txService = TxService.getInstance();
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: async () => {
        return txService.withdrawUnstakedVLS();
      },
      onError: (error) => {
        console.error(error);
      },
      onSuccess: async (data) => {
        console.log("VLS withdrawal successful:", data);
        
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY] }),
          queryClient.invalidateQueries({ queryKey: [GOVERNANCE_USER_INFO_QUERY_KEY] }),
          queryClient.invalidateQueries({ queryKey: [USER_PENDING_UNSTAKES_QUERY_KEY] })
        ]);
        
        setTimeout(async () => {
          await Promise.all([
            queryClient.refetchQueries({ queryKey: [USER_QUERY_KEY] }),
            queryClient.refetchQueries({ queryKey: [USER_PENDING_UNSTAKES_QUERY_KEY] })
          ]);
        }, 1000);
      }
    });
  }
  
export function useVoteMutation() {
    const txService = TxService.getInstance();
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: async ({ 
        proposalId, 
        choice, 
        reason = '' 
      }: { 
        proposalId: string; 
        choice: 'YES' | 'NO' | 'ABSTAIN'; 
        reason?: string; 
      }) => {
        return txService.voteOnProposal(proposalId, choice, reason);
      },
      onError: (error) => {
        console.error(error);
      },
      onSuccess: async (data, variables) => {
        console.log("Vote successful:", data);
        console.log("Invalidating queries for proposal:", variables.proposalId);
        
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: [PROPOSAL_QUERY_KEY, variables.proposalId] }),
          queryClient.invalidateQueries({ queryKey: [PROPOSALS_QUERY_KEY] }),
          queryClient.invalidateQueries({ queryKey: [ACTIVE_PROPOSALS_QUERY_KEY] }),
          queryClient.invalidateQueries({ queryKey: [XVLS_BALANCE_QUERY_KEY] }),
          queryClient.invalidateQueries({ queryKey: [USER_VOTE_QUERY_KEY, variables.proposalId] })
        ]);
        
        setTimeout(async () => {
          await Promise.all([
            queryClient.refetchQueries({ queryKey: [PROPOSAL_QUERY_KEY, variables.proposalId] }),
            queryClient.refetchQueries({ queryKey: [USER_VOTE_QUERY_KEY, variables.proposalId] })
          ]);
        }, 1000);
      }
    });
  }
  
export function useExecuteProposalMutation() {
    const txService = TxService.getInstance();
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: async ({
        proposalId,
      }: {
        proposalId: string;
      }) => {
        return txService.executeProposal(proposalId);
      },
      onError: (error) => {
        console.error(error);
      },
      onSuccess: async (_data, variables) => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: [PROPOSAL_QUERY_KEY, variables.proposalId] }),
          queryClient.invalidateQueries({ queryKey: [PROPOSALS_QUERY_KEY] }),
          queryClient.invalidateQueries({ queryKey: [ACTIVE_PROPOSALS_QUERY_KEY] }),
        ]);
  
        setTimeout(async () => {
          await Promise.all([
            queryClient.refetchQueries({ queryKey: [PROPOSAL_QUERY_KEY, variables.proposalId] }),
          ]);
        }, 1000);
      },
    });
  }
      