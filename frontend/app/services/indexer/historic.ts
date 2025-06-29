import { SUPPLY_BORROW_FIELDS } from './utils/fields.indexer';
import {
  buildQuery
} from './utils/query-builder';
import { MarketActivity, TransactionData } from './utils/types.indexer';

// ------------------------------------------------------------ TOTAL SUPPLY HISTORY ------------------------------------------------------------

export async function getSupplyHistory(marketId: string): Promise<TransactionData[]> {
  const query = buildQuery("getSupplyEvents", SUPPLY_BORROW_FIELDS)
    .where()
    .success(true)
    .eventType("Deposit")
    .marketId(marketId);

  const parsed = await query.executeAndParse({
    filterByEventTypes: ["Deposit"],
    filterByMarketId: marketId,
  });

  return parsed
    .filter((item: TransactionData) => item.amount);
}

export async function getWithdrawHistory(marketId: string): Promise<TransactionData[]> {
  const query = buildQuery("getWithdrawEvents", SUPPLY_BORROW_FIELDS)
    .where()
    .success(true)
    .eventType("Withdraw")
    .marketId(marketId);

  const parsed = await query.executeAndParse({
    filterByEventTypes: ["Withdraw"],
    filterByMarketId: marketId,
  });

  return parsed
    .filter((item: TransactionData) => item.amount);
}

// ------------------------------------------------------------ BORROW HISTORY ------------------------------------------------------------

export async function getBorrowHistory(marketId: string): Promise<TransactionData[]> {
  const query = buildQuery("getBorrowEvents", SUPPLY_BORROW_FIELDS)
    .where()
    .success(true)
    .eventType("Borrow")
    .marketId(marketId);

  const parsed = await query.executeAndParse({
    filterByEventTypes: ["Borrow"],
    filterByMarketId: marketId,
  });

  return parsed
    .filter((item: TransactionData) => item.amount);
}

export async function getRepayHistory(marketId: string): Promise<TransactionData[]> {
  const query = buildQuery("getRepayEvents", SUPPLY_BORROW_FIELDS)
    .where()
    .success(true)
    .eventType("Repay")
    .marketId(marketId);

  const parsed = await query.executeAndParse({
    filterByEventTypes: ["Repay"],
    filterByMarketId: marketId,
  });

  return parsed
    .filter((item: TransactionData) => item.amount);
}

// ------------------------------------------------------------ ALL ACTIVITY HISTORY ------------------------------------------------------------

export async function getMarketActivity(marketId: string): Promise<MarketActivity[]> {
  const query = buildQuery("getMarketActivity")
    .where()
    .success(true)
    .marketId(marketId);

  const parsed = await query.executeAndParse({
    filterByMarketId: marketId,
  });

  return parsed.map((item: TransactionData) => ({
    block_height: item.block_height,
    type: item.event_type ? item.event_type.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') : '',
    amount: item.amount || null,
    caller: item.caller || null,
    tx_hash: item.hash || '',
    func: item.event_func,
    timestamp: item.timestamp!,
  }));
}

