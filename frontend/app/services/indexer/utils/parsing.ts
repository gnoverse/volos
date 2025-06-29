import { queryIndexer } from "@/app/services/indexer/utils/query-builder";
import { GnoEventAttr, Transaction } from "@/app/services/indexer/utils/types.indexer";

/**
 * Parses raw transaction data from the indexer and extracts meaningful information.
 * This function processes transactions and their associated events, applying filters
 * and automatically fetching block timestamps for each transaction.
 * 
 * The function handles:
 * - Transaction message extraction (caller, function, arguments, etc.)
 * - Event parsing and filtering by type and market ID
 * - Amount extraction from event attributes
 * - Automatic block timestamp fetching for all transactions
 * 
 * @param transactions - Array of raw transaction objects from the indexer
 * @param options - Optional filtering and processing options
 * @returns Promise resolving to an array of parsed transaction data with timestamps
 */
export async function parseTransactions(
  transactions: Transaction[],
  options?: {
    filterByMarketId?: string;
    filterByEventTypes?: string[];
    includeAllEvents?: boolean;
  }
): Promise<{
  block_height: number;
  index?: number;
  hash?: string;
  caller?: string;
  send?: string;
  pkg_path?: string;
  func?: string;
  args?: string[];
  event_type?: string;
  event_func?: string;
  event_attrs?: GnoEventAttr[];
  amount?: string;
  market_id?: string;
  timestamp?: number;
}[]> {
  const results: {
    block_height: number;
    index?: number;
    hash?: string;
    caller?: string;
    send?: string;
    pkg_path?: string;
    func?: string;
    args?: string[];
    event_type?: string;
    event_func?: string;
    event_attrs?: GnoEventAttr[];
    amount?: string;
    market_id?: string;
  }[] = [];

  for (const tx of transactions) {
    const baseData: Partial<typeof results[0]> = {
      block_height: tx.block_height,
    };

    if (tx.index !== undefined) baseData.index = tx.index;
    if (tx.hash !== undefined) baseData.hash = tx.hash;
    if (tx.messages?.[0]?.value?.caller !== undefined) baseData.caller = tx.messages[0].value.caller;
    if (tx.messages?.[0]?.value?.send !== undefined) baseData.send = tx.messages[0].value.send;
    if (tx.messages?.[0]?.value?.pkg_path !== undefined) baseData.pkg_path = tx.messages[0].value.pkg_path;
    if (tx.messages?.[0]?.value?.func !== undefined) baseData.func = tx.messages[0].value.func;
    if (tx.messages?.[0]?.value?.args !== undefined) baseData.args = tx.messages[0].value.args;

    const events = tx.response?.events || [];
    
    if (events.length > 0) {
      for (const event of events) {
        if (options?.filterByEventTypes && !options.filterByEventTypes.includes(event.type)) {
          continue;
        }

        if (options?.filterByMarketId) {
          const marketIdAttr = event.attrs?.find(a => a.key === "market_id");
          if (!marketIdAttr || marketIdAttr.value !== options.filterByMarketId) {
            continue;
          }
        }

        const amountAttr = event.attrs?.find(a => a.key === "amount") || event.attrs?.find(a => a.key === "assets");
        const marketIdAttr = event.attrs?.find(a => a.key === "market_id");

        const eventData: Partial<typeof results[0]> = {
          ...baseData,
        };

        if (event.type !== undefined) eventData.event_type = event.type;
        if (event.func !== undefined) eventData.event_func = event.func;
        if (event.attrs !== undefined) eventData.event_attrs = event.attrs;
        if (amountAttr?.value !== undefined) eventData.amount = amountAttr.value;
        if (marketIdAttr?.value !== undefined) eventData.market_id = marketIdAttr.value;

        results.push(eventData as typeof results[0]);
      }
    } else if (options?.includeAllEvents !== false) {
      results.push(baseData as typeof results[0]);
    }
  }

  const blockHeights = [...new Set(results.map(tx => tx.block_height))];
  
  const blockTimesMap = await getBlockTimesMap(blockHeights);
  
  return results.map(tx => ({
    ...tx,
    timestamp: blockTimesMap.get(tx.block_height)
  }));
}

/**
 * Builds a GraphQL query to fetch block timestamps for a list of block heights.
 * This function constructs a query that uses the _or operator to fetch multiple
 * blocks in a single request, which is more efficient than individual queries.
 * 
 * The generated query filters blocks by height using an OR condition, allowing
 * us to fetch timestamps for multiple blocks at once.
 * 
 * @param blockHeights - Array of block heights to fetch timestamps for
 * @returns GraphQL query string for fetching block times
 */
export function buildBlockTimesQuery(blockHeights: number[]): string {
  if (blockHeights.length === 0) {
    return '';
  }

  const heightConditions = blockHeights.map(height => `
        {
          height: {
            eq: ${height}
          }
        }`).join(',');

  return `
    query getBlockTimes {
      getBlocks(
        where: {
          _or: [
            ${heightConditions}
          ]
        }
      ) {
        height
        time
      }
    }
  `;
}

/**
 * Fetches block timestamps for given block heights and returns a mapping.
 * This function queries the indexer for block information and converts the
 * RFC3339Nano time format to JavaScript timestamps (milliseconds).
 * 
 * The function handles:
 * - Batch fetching of multiple block timestamps in a single query
 * - Parsing RFC3339Nano format strings to JavaScript timestamps
 * - Error handling for malformed time strings
 * - Efficient mapping of block height to timestamp
 * 
 * @param blockHeights - Array of block heights to fetch timestamps for
 * @returns Promise resolving to a Map of block height -> timestamp (milliseconds)
 */
export async function getBlockTimesMap(blockHeights: number[]): Promise<Map<number, number>> {
  if (blockHeights.length === 0) {
    return new Map();
  }

  const query = buildBlockTimesQuery(blockHeights);
  const response = await queryIndexer(query, "getBlockTimes") as { data?: { getBlocks?: Array<{ height: number; time: string }> } };
  
  const blocks = response?.data?.getBlocks || [];
  const timeMap = new Map<number, number>();
  
  for (const block of blocks) {
    // Parse RFC3339Nano format string to timestamp (milliseconds)
    // Format: "2006-01-02T15:04:05.999999999Z07:00"
    try {
      const timestamp = new Date(block.time).getTime();
      timeMap.set(block.height, timestamp);
    } catch (error) {
      console.warn(`Failed to parse block time for height ${block.height}:`, block.time, error);
    }
  }
  
  return timeMap;
}