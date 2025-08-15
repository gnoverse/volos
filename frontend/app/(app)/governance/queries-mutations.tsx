import { getActiveProposals, getProposals, getUser, type User } from '@/app/services/api.service';
import { ProposalsResponse } from '@/app/types';
import { useQuery } from '@tanstack/react-query';

export const PROPOSALS_QUERY_KEY = 'proposals';
export const ACTIVE_PROPOSALS_QUERY_KEY = 'active-proposals';
export const USER_QUERY_KEY = 'user';

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
