import axios from 'axios';

export type ChartData = {
  value: number;
  timestamp: string;
};

export type MarketActivity = {
  type: string;
  amount: number;
  caller: string;
  hash: string;
  timestamp: string;
  isAmountInShares: boolean;
};

export type User = {
  address: string;
  dao_member: boolean;
  staked_vls: Record<string, number>;
  created_at: string | null;
};
export interface Proposal {
  id: string
  title: string
  body: string
  proposer: string
  deadline: string
  status: string
  created_at: string
  last_vote: string
  yes_votes: number
  no_votes: number
  abstain_votes: number
  total_votes: number
  quorum: number
}

export interface ProposalsResponse {
  proposals: Proposal[]
  has_more: boolean
  last_id: string
}

export interface GovernanceUserInfo {
  address: string
  vlsBalance: number
  xvlsBalance: number
  proposalThreshold: number
  isMember: boolean
}

export interface UserVote {
	proposal_id: string
	voter: string
	vote_choice: string
	reason: string
	xvls_amount: number
	timestamp: string
}

export interface PendingUnstake {
	amount: number
	delegatee: string
	unlock_at: string
}

// Market types
export interface Market {
  id: string
  loan_token: string
  collateral_token: string
  total_supply: string
  total_borrow: string
  current_supply_apr: number
  current_borrow_apr: number
  created_at: string
  updated_at: string
}

export interface MarketsResponse {
  markets: Market[]
  has_more: boolean
  last_id: string
}

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8080/api';

export async function getTotalSupplyHistory(marketId: string): Promise<ChartData[]> {
  const res = await axios.get(`${API_BASE}/total-supply-history`, { params: { marketId } });
  return res.data;
}

export async function getTotalBorrowHistory(marketId: string): Promise<ChartData[]> {
  const res = await axios.get(`${API_BASE}/total-borrow-history`, { params: { marketId } });
  return res.data;
}

export async function getUtilizationHistory(marketId: string): Promise<ChartData[]> {
  const res = await axios.get(`${API_BASE}/total-utilization-history`, { params: { marketId } });
  return res.data;
}

export async function getMarketActivity(marketId: string): Promise<MarketActivity[]> {
  const res = await axios.get(`${API_BASE}/market-activity`, { params: { marketId } });
  return res.data;
}

export async function getAPRHistory(marketId: string): Promise<ChartData[]> {
  const res = await axios.get(`${API_BASE}/apr-history`, { params: { marketId } });
  return res.data;
}

export async function getUserLoanHistory(caller: string): Promise<ChartData[]> {
  const res = await axios.get(`${API_BASE}/user-loans`, { params: { caller } });
  return res.data;
} 

export async function getUserCollateralHistory(caller: string, marketId: string): Promise<ChartData[]> {
  const res = await axios.get(`${API_BASE}/user-collateral`, { params: { caller, marketId } });
  return res.data;
}

export async function getUserBorrowHistory(caller: string, marketId: string): Promise<ChartData[]> {
  const res = await axios.get(`${API_BASE}/user-borrow`, { params: { caller, marketId } });
  return res.data;
} 

export async function getProposals(limit?: number, lastId?: string): Promise<ProposalsResponse> {
  const params: Record<string, string | number> = {};
  if (limit) params.limit = limit;
  if (lastId) params.last_id = lastId;
  
  const res = await axios.get(`${API_BASE}/proposals`, { params });
  return res.data;
}

export async function getActiveProposals(limit?: number, lastId?: string): Promise<ProposalsResponse> {
  const params: Record<string, string | number> = {};
  if (limit) params.limit = limit;
  if (lastId) params.last_id = lastId;
  
  const res = await axios.get(`${API_BASE}/proposals/active`, { params });
  return res.data;
}

export async function getProposal(proposalId: string): Promise<Proposal> {
  const res = await axios.get(`${API_BASE}/proposal/${proposalId}`);
  return res.data;
}

export async function getUser(address: string): Promise<User> {
  const res = await axios.get(`${API_BASE}/user`, { params: { address } });
  return res.data;
}

export async function getUserVoteOnProposal(proposalId: string, userAddress: string): Promise<UserVote | null> {
	const res = await axios.get(`${API_BASE}/user-vote`, { 
		params: { proposalId, userAddress } 
	});
	return res.data;
}

export async function getUserPendingUnstakes(userAddress: string): Promise<PendingUnstake[]> {
	const res = await axios.get(`${API_BASE}/user-pending-unstakes`, { 
		params: { userAddress } 
	});
	return res.data;
}

export async function getMarkets(limit?: number, lastId?: string): Promise<MarketsResponse> {
  const params: Record<string, string | number> = {};
  if (limit) params.limit = limit;
  if (lastId) params.last_id = lastId;

  const res = await axios.get(`${API_BASE}/markets`, { params });
  return res.data;
}

export async function getMarket(marketId: string): Promise<Market> {
  const encoded = encodeURIComponent(marketId);
  const res = await axios.get(`${API_BASE}/market/${encoded}`);
  return res.data;
}
