import axios from "axios";

// start tx indexer for gnodev on port 3100:
// /build/tx-indexer start --remote http://localhost:26657 --db-path indexer-db --listen-address localhost:3100

// const txIndexerUrl = "https://indexer.test6.testnets.gno.land"
const txIndexerUrl = "http://localhost:3100"

type GnoEventAttr = { key: string; value: string }
type GnoEvent = { type: string; attrs: GnoEventAttr[] }
type Transaction = { block_height: number; hash?: string; response: { events: GnoEvent[] }, messages?: { value: { caller: string } }[] }

export async function queryIndexer(
  query: string, 
  operationName: string, 
  variables?: Record<string, unknown>
): Promise<unknown> {
  try {
    const response = await axios.post(
      `${txIndexerUrl}/graphql/query`,
      { query, operationName, variables },
      { headers: { 'Content-Type': 'application/json' } }
    )

    return response.data
  } catch (error) {
    console.error('Indexer query failed:', error)
    throw error
  }
}

// Helper to extract event data
function extractEventHistory(
  transactions: { block_height: number; response: { events: { type: string; attrs: { key: string; value: string }[] }[] } }[],
  eventType: string,
  marketId?: string // optional: filter by market
) {
  const history: { amount: string; block_height: number; market_id?: string }[] = [];
  for (const tx of transactions) {
    const blockHeight = tx.block_height;
    for (const event of tx.response?.events || []) {
      if (event.type === eventType) {
        const amountAttr = event.attrs.find(a => a.key === "amount");
        const marketIdAttr = event.attrs.find(a => a.key === "market_id");
        if (
          amountAttr &&
          (!marketId || (marketIdAttr && marketIdAttr.value === marketId))
        ) {
          history.push({
            amount: amountAttr.value,
            block_height: blockHeight,
            market_id: marketIdAttr?.value,
          });
        }
      }
    }
  }

  return history;
}

// ------------------------------------------------------------ TOTAL SUPPLY HISTORY ------------------------------------------------------------

export async function getSupplyHistory(marketId: string): Promise<{ amount: string, block_height: number }[]> {
  const query = `
    query getSupplyEvents {
      getTransactions(
        where: {
          success: { eq: true }
          response: {
            events: {
              GnoEvent: {
                type: { eq: "Deposit" }
                attrs: { key: { eq: "market_id" }, value: { eq: "${marketId}" } }
              }
            }
          }
        }
      ) {
        block_height
        response {
          events {
            ... on GnoEvent {
              type
              attrs {
                key
                value
              }
            }
          }
        }
      }
    }
  `
  const operationName = "getSupplyEvents"
  const res = await queryIndexer(query, operationName) as { data?: { getTransactions?: Transaction[] } }
  const transactions = res?.data?.getTransactions ?? [];
  return extractEventHistory(transactions, "Deposit", marketId)
}

export async function getWithdrawHistory(marketId: string): Promise<{ amount: string, block_height: number }[]> {
  const query = `
    query getWithdrawEvents {
      getTransactions(
        where: {
          success: { eq: true }
          response: {
            events: {
              GnoEvent: {
                type: { eq: "Withdraw" }
                attrs: { key: { eq: "market_id" }, value: { eq: "${marketId}" } }
              }
            }
          }
        }
      ) {
        block_height
        response {
          events {
            ... on GnoEvent {
              type
              attrs {
                key
                value
              }
            }
          }
        }
      }
    }
  `
  const operationName = "getWithdrawEvents"
  const res = await queryIndexer(query, operationName) as { data?: { getTransactions?: Transaction[] } }
  const transactions = res?.data?.getTransactions ?? [];
  return extractEventHistory(transactions, "Withdraw", marketId)
}

export async function getNetSupplyHistory(marketId: string): Promise<{ value: number; block_height: number }[]> {
  const [deposits, withdraws] = await Promise.all([
    getSupplyHistory(marketId),
    getWithdrawHistory(marketId)
  ]);

  const depositEvents = deposits.map(d => ({
    value: Number(d.amount),
    block_height: d.block_height,
  }));

  const withdrawEvents = withdraws.map(w => ({
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

// ------------------------------------------------------------ BORROW HISTORY ------------------------------------------------------------

export async function getBorrowHistory(marketId: string): Promise<{ amount: string, block_height: number }[]> {
  const query = `
    query getBorrowEvents {
      getTransactions(
        where: {
          success: { eq: true }
          response: {
            events: {
              GnoEvent: {
                type: { eq: "Borrow" }
                attrs: { key: { eq: "market_id" }, value: { eq: "${marketId}" } }
              }
            }
          }
        }
      ) {
        block_height
        response {
          events {
            ... on GnoEvent {
              type
              attrs {
                key
                value
              }
            }
          }
        }
      }
    }
  `;
  const operationName = "getBorrowEvents";
  const res = await queryIndexer(query, operationName) as { data?: { getTransactions?: Transaction[] } };
  const transactions = res?.data?.getTransactions ?? [];
  return extractEventHistory(transactions, "Borrow", marketId);
}

export async function getRepayHistory(marketId: string): Promise<{ amount: string, block_height: number }[]> {
  const query = `
    query getRepayEvents {
      getTransactions(
        where: {
          success: { eq: true }
          response: {
            events: {
              GnoEvent: {
                type: { eq: "Repay" }
                attrs: { key: { eq: "market_id" }, value: { eq: "${marketId}" } }
              }
            }
          }
        }
      ) {
        block_height
        response {
          events {
            ... on GnoEvent {
              type
              attrs {
                key
                value
              }
            }
          }
        }
      }
    }
  `;
  const operationName = "getRepayEvents";
  const res = await queryIndexer(query, operationName) as { data?: { getTransactions?: Transaction[] } };
  const transactions = res?.data?.getTransactions ?? [];
  return extractEventHistory(transactions, "Repay", marketId);
}

export async function getNetBorrowHistory(marketId: string): Promise<{ value: number; block_height: number }[]> {
  const [borrows, repays] = await Promise.all([
    getBorrowHistory(marketId),
    getRepayHistory(marketId)
  ]);

  const borrowEvents = borrows.map(b => ({
    value: Number(b.amount),
    block_height: b.block_height,
  }));

  const repayEvents = repays.map(r => ({
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

// ------------------------------------------------------------ ALL ACTIVITY HISTORY ------------------------------------------------------------

export async function getMarketActivity(marketId: string): Promise<{
block_height: number;
type: string;
amount: string | null;
caller: string | null;
  tx_hash: string;
}[]> {
  const query = `
    query getMarketActivity {
      getTransactions(
        where: {
          success: { eq: true }
          response: {
            events: {
              GnoEvent: {
                attrs: { key: { eq: \"market_id\" }, value: { eq: \"${marketId}\" } }
              }
            }
          }
        }
      ) {
        block_height
        hash
        messages {
        ... on TransactionMessage{
          value {
            ... on MsgCall {
              caller
            }
          }
        }
     }
        response {
          events {
            ... on GnoEvent {
              type
              attrs {
                key
                value
              }
            }
          }
        }
      }
    }
  `;
  const operationName = "getMarketActivity";
  const res = await queryIndexer(query, operationName) as { data?: { getTransactions?: Transaction[] } };
  const transactions = res?.data?.getTransactions ?? [];

  const activity: {
    block_height: number;
    type: string;
    amount: string | null;
    caller: string | null;
    tx_hash: string;
  }[] = [];

  for (const tx of transactions) {
    const blockHeight = tx.block_height;
    const txHash = tx.hash;
    let caller: string | null = null;
    if (Array.isArray(tx.messages) && tx.messages.length > 0) {
      const msgValue = tx.messages[0]?.value;
      if (msgValue && typeof msgValue === 'object' && 'caller' in msgValue) {
        caller = (msgValue as { caller?: string }).caller ?? null;
      }
    }
    for (const event of tx.response?.events || []) {
      const marketIdAttr = event.attrs.find((a: GnoEventAttr) => a.key === "market_id" && a.value === marketId);
      if (marketIdAttr) {
        const amountAttr = event.attrs.find((a: GnoEventAttr) => a.key === "amount") || event.attrs.find((a: GnoEventAttr) => a.key === "assets");
        // format type: separate camel case words
        const formattedType = event.type.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
        activity.push({
          block_height: blockHeight,
          type: formattedType,
          amount: amountAttr ? amountAttr.value : null,
          caller,
          tx_hash: txHash || "",
        });
      }
    }
  }

  return activity;
}

