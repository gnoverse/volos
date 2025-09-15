import { apiGetUserInfo, apiGetXVLSBalance } from '@/app/services/abci';
import { getActiveProposals, getMarkets, getProposal, getProposals, getUserLoanHistory, getUser, getUserMarketPosition, getSupplyHistory, getBorrowHistory, getCollateralSupplyHistory, getUtilizationHistory, getAPRHistory, getMarketActivity, getMarketSnapshots, getUserPendingUnstakes } from '@/app/services/api.service';
import { Balance, GovernanceUserInfo, Market, PendingUnstake, Position, Proposal, ProposalsResponse, User, UserVote } from '@/app/types';
import { getMarket, getUserVoteOnProposal } from '@/app/services/api.service';
import { useQuery } from '@tanstack/react-query';

export const PROPOSALS_QUERY_KEY = 'proposals';
export const ACTIVE_PROPOSALS_QUERY_KEY = 'active-proposals';
export const PROPOSAL_QUERY_KEY = 'proposal';
export const USER_QUERY_KEY = 'user';
export const GOVERNANCE_USER_INFO_QUERY_KEY = 'governance-user-info';
export const XVLS_BALANCE_QUERY_KEY = 'xvls-balance';
export const USER_VOTE_QUERY_KEY = 'user-vote';
export const USER_PENDING_UNSTAKES_QUERY_KEY = 'user-pending-unstakes';
export const MARKETS_QUERY_KEY = 'markets';
export const USER_LOAN_HISTORY_QUERY_KEY = 'user-loan-history';
export const MARKET_QUERY_KEY = 'market';
export const POSITION_QUERY_KEY = 'position';
export const NET_SUPPLY_HISTORY_QUERY_KEY = 'net-supply-history';
export const NET_BORROW_HISTORY_QUERY_KEY = 'net-borrow-history';
export const COLLATERAL_SUPPLY_HISTORY_QUERY_KEY = 'collateral-supply-history';
export const UTILIZATION_HISTORY_QUERY_KEY = 'utilization-history';
export const APR_HISTORY_QUERY_KEY = 'apr-history';
export const MARKET_ACTIVITY_QUERY_KEY = 'market-activity';
export const MARKET_SNAPSHOTS_QUERY_KEY = 'market-snapshots';

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
  
// Governance queries -----------------------------------------------

export function useProposals(limit?: number, lastId?: string) {
    return useQuery<ProposalsResponse>({
      queryKey: [PROPOSALS_QUERY_KEY, limit, lastId],
      queryFn: () => getProposals(limit, lastId),
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    });
}
  
export function useActiveProposals(limit?: number, lastId?: string) {
  return useQuery<ProposalsResponse>({
    queryKey: [ACTIVE_PROPOSALS_QUERY_KEY, limit, lastId],
    queryFn: () => getActiveProposals(limit, lastId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useAllProposals(limit?: number) {
  return useQuery<ProposalsResponse>({
    queryKey: [PROPOSALS_QUERY_KEY, 'all'],
    queryFn: () => getProposals(limit),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useAllActiveProposals(limit?: number) {
  return useQuery<ProposalsResponse>({
    queryKey: [ACTIVE_PROPOSALS_QUERY_KEY, 'all'],
    queryFn: () => getActiveProposals(limit),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useProposal(proposalId?: string) {
  return useQuery<Proposal>({
    queryKey: [PROPOSAL_QUERY_KEY, proposalId],
    queryFn: () => getProposal(proposalId!),
    enabled: !!proposalId,
    staleTime: 5 * 1000,
    gcTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 3,
  });
}

export function useUser(address?: string) {
  return useQuery<User>({
    queryKey: [USER_QUERY_KEY, address],
    queryFn: () => getUser(address!),
    enabled: !!address, 
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

export function useGovernanceUserInfo(address?: string) {
  return useQuery<GovernanceUserInfo>({
    queryKey: [GOVERNANCE_USER_INFO_QUERY_KEY, address],
    queryFn: () => apiGetUserInfo(address!),
    enabled: !!address,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 3,
  });
}
  
export function useXVLSBalance(address?: string) {
  return useQuery<Balance>({
    queryKey: [XVLS_BALANCE_QUERY_KEY, address],
    queryFn: () => apiGetXVLSBalance(address!),
    enabled: !!address,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

export function useUserVoteOnProposal(proposalId?: string, userAddress?: string) {
  return useQuery<UserVote | null>({
    queryKey: [USER_VOTE_QUERY_KEY, proposalId, userAddress],
    queryFn: () => getUserVoteOnProposal(proposalId!, userAddress!),
    enabled: !!proposalId && !!userAddress,
    staleTime: 5 * 1000,
    gcTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

export function useUserPendingUnstakes(userAddress?: string) {
  return useQuery<PendingUnstake[]>({
    queryKey: [USER_PENDING_UNSTAKES_QUERY_KEY, userAddress],
    queryFn: () => getUserPendingUnstakes(userAddress!),
    enabled: !!userAddress,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}
