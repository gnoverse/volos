import {
  buildQuery
} from './utils/query-builder';
import { MarketActivity, TransactionData } from './utils/types.indexer';

// ------------------------------------------------------------ TOTAL SUPPLY HISTORY ------------------------------------------------------------

export async function getSupplyHistory(marketId: string): Promise<TransactionData[]> {
  const parsed = await buildQuery("getSupplyEvents")
    .where()
    .success(true)
    .eventType("Deposit")
    .marketId(marketId)
    .executeAndParse({
      filterByEventTypes: ["Deposit"],
      filterByMarketId: marketId,
    });

  return parsed
    .filter((item: TransactionData) => item.amount);
}

export async function getWithdrawHistory(marketId: string): Promise<TransactionData[]> {
  const parsed = await buildQuery("getWithdrawEvents")
    .where()
    .success(true)
    .eventType("Withdraw")
    .marketId(marketId)
    .executeAndParse({
      filterByEventTypes: ["Withdraw"],
      filterByMarketId: marketId,
    });

  return parsed
    .filter((item: TransactionData) => item.amount);
}

// ------------------------------------------------------------ BORROW HISTORY ------------------------------------------------------------

export async function getBorrowHistory(marketId: string): Promise<TransactionData[]> {
  const parsed = await buildQuery("getBorrowEvents")
    .where()
    .success(true)
    .eventType("Borrow")
    .marketId(marketId)
    .executeAndParse({
      filterByEventTypes: ["Borrow"],
      filterByMarketId: marketId,
    });

  return parsed
    .filter((item: TransactionData) => item.amount);
}

export async function getRepayHistory(marketId: string): Promise<TransactionData[]> {
  const parsed = await buildQuery("getRepayEvents")
    .where()
    .success(true)
    .eventType("Repay")
    .marketId(marketId)
    .executeAndParse({
      filterByEventTypes: ["Repay"],
      filterByMarketId: marketId,
    });

  return parsed
    .filter((item: TransactionData) => item.amount);
}

// ------------------------------------------------------------ ALL ACTIVITY HISTORY ------------------------------------------------------------

export async function getMarketActivity(marketId: string): Promise<MarketActivity[]> {
  const parsed = await buildQuery("getMarketActivity")
    .where()
    .success(true)
    .marketId(marketId)
    .executeAndParse({
      filterByMarketId: marketId,
    });

  return parsed.map((item: TransactionData) => ({
    block_height: item.block_height,
    type: item.event_type ? item.event_type.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') : '',
    amount: item.amount || null,
    caller: item.caller || null,
    tx_hash: item.hash || '',
    func: item.event_func,
  }));
}

