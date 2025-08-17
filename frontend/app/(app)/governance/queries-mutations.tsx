import { apiGetUserInfo, apiGetXVLSBalance } from '@/app/services/abci';
import { Balance } from '@/app/types';
import { getActiveProposals, getProposal, getProposals, getUser, GovernanceUserInfo, Proposal, ProposalsResponse, type User } from '@/app/services/api.service';
import { TxService } from '@/app/services/tx.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const PROPOSALS_QUERY_KEY = 'proposals';
export const ACTIVE_PROPOSALS_QUERY_KEY = 'active-proposals';
export const PROPOSAL_QUERY_KEY = 'proposal';
export const USER_QUERY_KEY = 'user';
export const GOVERNANCE_USER_INFO_QUERY_KEY = 'governance-user-info';
export const XVLS_BALANCE_QUERY_KEY = 'xvls-balance';

// Hook to fetch all proposals with pagination
export function useProposals(limit?: number, lastId?: string) {
  return useQuery<ProposalsResponse>({
    queryKey: [PROPOSALS_QUERY_KEY, limit, lastId],
    queryFn: () => getProposals(limit, lastId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook to fetch active proposals with pagination
export function useActiveProposals(limit?: number, lastId?: string) {
  return useQuery<ProposalsResponse>({
    queryKey: [ACTIVE_PROPOSALS_QUERY_KEY, limit, lastId],
    queryFn: () => getActiveProposals(limit, lastId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook to fetch first page of all proposals (default limit)
export function useAllProposals() {
  return useQuery<ProposalsResponse>({
    queryKey: [PROPOSALS_QUERY_KEY, 'all'],
    queryFn: () => getProposals(20), // Default limit of 20
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Hook to fetch first page of active proposals (default limit)
export function useAllActiveProposals() {
  return useQuery<ProposalsResponse>({
    queryKey: [ACTIVE_PROPOSALS_QUERY_KEY, 'all'],
    queryFn: () => getActiveProposals(20), // Default limit of 20
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Hook to fetch a single proposal by ID
export function useProposal(proposalId?: string) {
  return useQuery<Proposal>({
    queryKey: [PROPOSAL_QUERY_KEY, proposalId],
    queryFn: () => getProposal(proposalId!),
    enabled: !!proposalId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    retry: 3,
  });
}

// Hook to fetch user data
export function useUser(address?: string) {
  return useQuery<User>({
    queryKey: [USER_QUERY_KEY, address],
    queryFn: () => getUser(address!),
    enabled: !!address, 
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

// Hook to fetch governance user info from on-chain
export function useGovernanceUserInfo(address?: string) {
  return useQuery<GovernanceUserInfo>({
    queryKey: [GOVERNANCE_USER_INFO_QUERY_KEY, address],
    queryFn: () => apiGetUserInfo(address!),
    enabled: !!address,
    staleTime: 30 * 1000, // 30 seconds (more frequent updates for on-chain data)
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true, // Refetch when window gains focus
    retry: 3,
  });
}

export function useApproveTokenMutation() {
  const txService = TxService.getInstance();
  
  return useMutation({
    mutationFn: async ({ 
      tokenPath, 
      amount,
      pkgPath
    }: { 
      tokenPath: string; 
      amount: number;
      pkgPath: string;
    }) => {
      return txService.approveToken(tokenPath, amount, pkgPath);
    },
    onError: (error) => {
      console.error("Token approval failed:", error);
    },
    onSuccess: (data) => {
      console.log("Token approval successful:", data);
    }
  });
}

// Mutation to approve VLS tokens directly via VLS contract
export function useApproveVLSMutation() {
  const txService = TxService.getInstance();
  
  return useMutation({
    mutationFn: async ({ 
      spender, 
      amount 
    }: { 
      spender: string; 
      amount: number; 
    }) => {
      return txService.approveRealmVLS(spender, amount);
    },
    onError: (error) => {
      console.error("VLS approval failed:", error);
    },
    onSuccess: (data) => {
      console.log("VLS approval successful:", data);
    }
  });
}

export function useStakeVLSMutation() {
  const txService = TxService.getInstance();
  
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
      console.error("VLS staking failed:", error);
    },
    onSuccess: (data) => {
      console.log("VLS staking successful:", data);
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
      console.error("Vote failed:", error);
    },
    onSuccess: (data, variables) => {
      console.log("Vote successful:", data);
      // Invalidate and refetch proposal data to show updated vote counts
      queryClient.invalidateQueries({ queryKey: [PROPOSAL_QUERY_KEY, variables.proposalId] });
      queryClient.invalidateQueries({ queryKey: [PROPOSALS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [ACTIVE_PROPOSALS_QUERY_KEY] });
      // Also invalidate xVLS balance in case it changed
      queryClient.invalidateQueries({ queryKey: [XVLS_BALANCE_QUERY_KEY] });
    }
  });
}

// Hook to fetch xVLS balance for a user
export function useXVLSBalance(address?: string) {
  return useQuery<Balance>({
    queryKey: [XVLS_BALANCE_QUERY_KEY, address],
    queryFn: () => apiGetXVLSBalance(address!),
    enabled: !!address,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    retry: 2,
  });
}
