import { getBorrowHistory, getRepayHistory, getSupplyHistory, getWithdrawHistory } from '../indexer/historic';
import { TransactionData } from '../indexer/utils/types.indexer';

// ------------------------------------------------------------ SERVER-SIDE NET SUPPLY HISTORY ------------------------------------------------------------

export async function getNetSupplyHistory(marketId: string) {
  const [deposits, withdraws] = await Promise.all([
    getSupplyHistory(marketId),
    getWithdrawHistory(marketId)
  ]);

  const depositEvents = deposits.map((d: TransactionData) => ({
    value: Number(d.amount),
    block_height: d.block_height,
  }));

  const withdrawEvents = withdraws.map((w: TransactionData) => ({
    value: -Number(w.amount),
    block_height: w.block_height,
  }));

  const allEvents = [...depositEvents, ...withdrawEvents].sort((a, b) => a.block_height - b.block_height);

  let runningTotal = 0;
  const netSupplyHistory = allEvents.map(event => {
    runningTotal += event.value;
    return {
      value: runningTotal,
      block_height: event.block_height,
    };
  });

  return netSupplyHistory;
}

// ------------------------------------------------------------ SERVER-SIDE NET BORROW HISTORY ------------------------------------------------------------

export async function getNetBorrowHistory(marketId: string) {
  const [borrows, repays] = await Promise.all([
    getBorrowHistory(marketId),
    getRepayHistory(marketId)
  ]);

  const borrowEvents = borrows.map((b: TransactionData) => ({
    value: Number(b.amount),
    block_height: b.block_height,
  }));

  const repayEvents = repays.map((r: TransactionData) => ({
    value: -Number(r.amount),
    block_height: r.block_height,
  }));

  const allEvents = [...borrowEvents, ...repayEvents].sort((a, b) => a.block_height - b.block_height);

  let runningTotal = 0;
  const netBorrowHistory = allEvents.map(event => {
    runningTotal += event.value;
    return {
      value: runningTotal,
      block_height: event.block_height,
    };
  });

  return netBorrowHistory;
}
