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

const API_BASE = 'http://localhost:8080/api';

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
