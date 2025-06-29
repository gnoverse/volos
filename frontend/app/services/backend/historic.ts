import { getBorrowHistory, getRepayHistory, getSupplyHistory, getWithdrawHistory } from '../indexer/historic';
import { ChartData, TransactionData } from '../indexer/utils/types.indexer';

// ------------------------------------------------------------ SERVER-SIDE UTILIZATION RATE HISTORY ------------------------------------------------------------

export async function getUtilizationHistory(marketId: string): Promise<ChartData[]> {
  const [supplyHistory, withdrawHistory, borrowHistory, repayHistory] = await Promise.all([
    getSupplyHistory(marketId),
    getWithdrawHistory(marketId),
    getBorrowHistory(marketId),
    getRepayHistory(marketId)
  ]);

  const eventsByBlock = new Map<number, {
    supply: number;
    withdraw: number;
    borrow: number;
    repay: number;
  }>();

  const initializeBlock = (timestamp: number) => {
    if (!eventsByBlock.has(timestamp)) {
      eventsByBlock.set(timestamp, {
        supply: 0,
        withdraw: 0,
        borrow: 0,
        repay: 0
      });
    }
  };

  supplyHistory.forEach(item => {
    initializeBlock(item.block_height);
    const block = eventsByBlock.get(item.block_height)!;
    block.supply += Number(item.amount || 0);
  });

  withdrawHistory.forEach(item => {
    initializeBlock(item.block_height);
    const block = eventsByBlock.get(item.block_height)!;
    block.withdraw += Number(item.amount || 0);
  });

  borrowHistory.forEach(item => {
    initializeBlock(item.block_height);
    const block = eventsByBlock.get(item.block_height)!;
    block.borrow += Number(item.amount || 0);
  });

  repayHistory.forEach(item => {
    initializeBlock(item.block_height);
    const block = eventsByBlock.get(item.block_height)!;
    block.repay += Number(item.amount || 0);
  });

  const utilizationHistory: ChartData[] = [];
  let currentSupply = 0;
  let currentBorrow = 0;
  let currentUtilization = 0;

  const sortedBlocks = Array.from(eventsByBlock.keys()).sort((a, b) => a - b);

  sortedBlocks.forEach(timestamp => {
    const events = eventsByBlock.get(timestamp)!;
    
    currentSupply += events.supply - events.withdraw;
    currentBorrow += events.borrow - events.repay;
    
    currentUtilization = currentSupply > 0 ? (currentBorrow / currentSupply) * 100 : 0;
    
    utilizationHistory.push({
      value: currentUtilization,
      timestamp: timestamp,
    });
  });
  
  return utilizationHistory;
}

// ------------------------------------------------------------ SERVER-SIDE NET SUPPLY HISTORY ------------------------------------------------------------

export async function getNetSupplyHistory(marketId: string) {
  const [deposits, withdraws] = await Promise.all([
    getSupplyHistory(marketId),
    getWithdrawHistory(marketId)
  ]);

  const depositEvents = deposits.map((d: TransactionData) => ({
    value: Number(d.amount),
    timestamp: d.timestamp,
  }));

  const withdrawEvents = withdraws.map((w: TransactionData) => ({
    value: -Number(w.amount),
    timestamp: w.timestamp,
  }));

  const allEvents = [...depositEvents, ...withdrawEvents].sort((a, b) => a.timestamp! - b.timestamp!);

  let runningTotal = 0;
  const netSupplyHistory = allEvents.map(event => {
    runningTotal += event.value;
    return {
      value: runningTotal,
      timestamp: event.timestamp,
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
    timestamp: b.timestamp,
  }));

  const repayEvents = repays.map((r: TransactionData) => ({
    value: -Number(r.amount),
    timestamp: r.timestamp,
  }));

  const allEvents = [...borrowEvents, ...repayEvents].sort((a, b) => a.timestamp! - b.timestamp!);

  let runningTotal = 0;
  const netBorrowHistory = allEvents.map(event => {
    runningTotal += event.value;
    return {
      value: runningTotal,
      timestamp: event.timestamp,
    };
  });

  return netBorrowHistory;
}
