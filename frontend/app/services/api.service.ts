import {
  APRData,
  ChartData,
  Market,
  MarketActivityResponse,
  MarketSnapshot,
  MarketsResponse,
  PendingUnstake,
  Proposal,
  ProposalsResponse,
  TotalBorrowData,
  TotalCollateralSupplyData,
  TotalSupplyData,
  User,
  UserLoan,
  UserVote,
  UtilizationData
} from "@/app/types";

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8080/api';

// API functions
export async function getUserLoanHistory(userAddress: string): Promise<UserLoan[]> {
  const response = await fetch(`${API_BASE}/user-loans?address=${userAddress}`);
  if (!response.ok) throw new Error('Failed to fetch user loan history');
  return response.json();
}

export async function getMarketActivity(marketId: string, limit?: number, lastId?: string): Promise<MarketActivityResponse> {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (lastId) params.append('lastId', lastId);
  
  const response = await fetch(`${API_BASE}/market-activity?marketId=${marketId}&${params}`);
  if (!response.ok) throw new Error('Failed to fetch market activity');
  return response.json();
}

export async function getUserCollateralHistory(caller: string, marketId: string): Promise<ChartData[]> {
  const response = await fetch(`${API_BASE}/markets/${marketId}/user/${caller}/collateral-history`);
  if (!response.ok) throw new Error('Failed to fetch user collateral history');
  return response.json();
}

export async function getUserBorrowHistory(caller: string, marketId: string): Promise<ChartData[]> {
  const response = await fetch(`${API_BASE}/markets/${marketId}/user/${caller}/borrow-history`);
  if (!response.ok) throw new Error('Failed to fetch user borrow history');
  return response.json();
}

export async function getProposals(limit?: number, lastId?: string): Promise<ProposalsResponse> {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (lastId) params.append('lastId', lastId);
  
  const response = await fetch(`${API_BASE}/proposals?${params}`);
  if (!response.ok) throw new Error('Failed to fetch proposals');
  return response.json();
}

export async function getActiveProposals(limit?: number, lastId?: string): Promise<ProposalsResponse> {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (lastId) params.append('lastId', lastId);
  
  const response = await fetch(`${API_BASE}/proposals/active?${params}`);
  if (!response.ok) throw new Error('Failed to fetch active proposals');
  return response.json();
}

export async function getProposal(proposalId: string): Promise<Proposal> {
  const response = await fetch(`${API_BASE}/proposal/${proposalId}`);
  if (!response.ok) throw new Error('Failed to fetch proposal');
  return response.json();
}

export async function getUser(address: string): Promise<User> {
  const response = await fetch(`${API_BASE}/user?address=${address}`);
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
}

export async function getUserVoteOnProposal(proposalId: string, userAddress: string): Promise<UserVote | null> {
  const response = await fetch(`${API_BASE}/user-vote?proposalId=${proposalId}&userAddress=${userAddress}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Failed to fetch user vote');
  return response.json();
}

export async function getUserPendingUnstakes(userAddress: string): Promise<PendingUnstake[]> {
  const response = await fetch(`${API_BASE}/user-pending-unstakes?address=${userAddress}`);
  if (!response.ok) throw new Error('Failed to fetch pending unstakes');
  return response.json();
}

export async function getMarkets(limit?: number, lastId?: string): Promise<MarketsResponse> {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (lastId) params.append('lastId', lastId);
  
  const response = await fetch(`${API_BASE}/markets?${params}`);
  if (!response.ok) throw new Error('Failed to fetch markets');
  return response.json();
}

export async function getMarket(marketId: string): Promise<Market> {
  const response = await fetch(`${API_BASE}/market/${marketId}`);
  if (!response.ok) throw new Error('Failed to fetch market');
  return response.json();
}

export async function getAPRHistory(marketId: string, startTime?: string, endTime?: string): Promise<APRData[]> {
  const params = new URLSearchParams();
  params.append('marketId', marketId);
  if (startTime) params.append('startTime', startTime);
  if (endTime) params.append('endTime', endTime);
  
  const response = await fetch(`${API_BASE}/apr?${params}`);
  if (!response.ok) throw new Error('Failed to fetch APR history');
  return response.json();
}

export async function getBorrowHistory(marketId: string, startTime?: string, endTime?: string): Promise<TotalBorrowData[]> {
  const params = new URLSearchParams();
  params.append('marketId', marketId);
  if (startTime) params.append('startTime', startTime);
  if (endTime) params.append('endTime', endTime);
  
  const response = await fetch(`${API_BASE}/borrow-history?${params}`);
  if (!response.ok) throw new Error('Failed to fetch borrow history');
  return response.json();
}

export async function getSupplyHistory(marketId: string, startTime?: string, endTime?: string): Promise<TotalSupplyData[]> {
  const params = new URLSearchParams();
  params.append('marketId', marketId);
  if (startTime) params.append('startTime', startTime);
  if (endTime) params.append('endTime', endTime);
  
  const response = await fetch(`${API_BASE}/supply-history?${params}`);
  if (!response.ok) throw new Error('Failed to fetch supply history');
  return response.json();
}

export async function getCollateralSupplyHistory(marketId: string, startTime?: string, endTime?: string): Promise<TotalCollateralSupplyData[]> {
  const params = new URLSearchParams();
  params.append('marketId', marketId);
  if (startTime) params.append('startTime', startTime);
  if (endTime) params.append('endTime', endTime);
  
  const response = await fetch(`${API_BASE}/collateral-supply-history?${params}`);
  if (!response.ok) throw new Error('Failed to fetch collateral supply history');
  return response.json();
}

export async function getUtilizationHistory(marketId: string, startTime?: string, endTime?: string): Promise<UtilizationData[]> {
  const params = new URLSearchParams();
  params.append('marketId', marketId);
  if (startTime) params.append('startTime', startTime);
  if (endTime) params.append('endTime', endTime);
  
  const response = await fetch(`${API_BASE}/utilization-history?${params}`);
  if (!response.ok) throw new Error('Failed to fetch utilization history');
  return response.json();
}

export async function getMarketSnapshots(
  marketId: string, 
  resolution?: '4hour' | 'daily' | 'weekly',
  startTime?: string,
  endTime?: string
): Promise<MarketSnapshot[]> {
  const params = new URLSearchParams();
  params.append('marketId', marketId);
  if (resolution) params.append('resolution', resolution);
  if (startTime) params.append('startTime', startTime);
  if (endTime) params.append('endTime', endTime);
  
  const response = await fetch(`${API_BASE}/snapshots?${params}`);
  if (!response.ok) throw new Error('Failed to fetch market snapshots');
  return response.json();
}
