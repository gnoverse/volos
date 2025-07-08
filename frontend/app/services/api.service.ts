import axios from 'axios';

export type Event = {
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

export async function getTotalSupplyHistory(marketId: string): Promise<Event[]> {
  const res = await axios.get(`${API_BASE}/total-supply-history`, { params: { marketId } });
  return res.data;
}

export async function getTotalBorrowHistory(marketId: string): Promise<Event[]> {
  const res = await axios.get(`${API_BASE}/total-borrow-history`, { params: { marketId } });
  return res.data;
}

export async function getUtilizationHistory(marketId: string): Promise<Event[]> {
  const res = await axios.get(`${API_BASE}/total-utilization-history`, { params: { marketId } });
  return res.data;
}

export async function getMarketActivity(marketId: string): Promise<MarketActivity[]> {
  const res = await axios.get(`${API_BASE}/market-activity`, { params: { marketId } });
  return res.data;
} 
