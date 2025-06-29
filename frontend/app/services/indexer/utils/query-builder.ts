import axios from "axios";
import {
  UNIVERSAL_TRANSACTION_FIELDS
} from './indexer.fields';
import { GnoEventAttr, GraphQLResponse, Transaction } from './types.indexer';

// start tx indexer for gnodev on port 3100:
// /build/tx-indexer start --remote http://localhost:26657 --db-path indexer-db --listen-address localhost:3100

// const txIndexerUrl = "https://indexer.test6.testnets.gno.land"
const txIndexerUrl = "http://localhost:3100"

export class QueryBuilder {
  private operationName: string;
  private whereBuilder: WhereClauseBuilder;
  private fields: string;

  constructor(operationName: string, fields: string = UNIVERSAL_TRANSACTION_FIELDS) {
    this.operationName = operationName;
    this.fields = fields;
    this.whereBuilder = new WhereClauseBuilder(this);
  }

  where(): WhereClauseBuilder {
    return this.whereBuilder;
  }

  useFields(fields: string): QueryBuilder {
    this.fields = fields;
    return this;
  }

  addFields(fields: string): QueryBuilder {
    this.fields += `\n          ${fields}`;
    return this;
  }

  build(): string {
    const whereClause = this.whereBuilder.build();
    return `
      query ${this.operationName} {
        getTransactions(
          where: {
            ${whereClause}
          }
        ) {
          ${this.fields}
        }
      }
    `;
  }

  async execute(variables?: Record<string, unknown>): Promise<GraphQLResponse> {
    const query = this.build();
    return await queryIndexer(query, this.operationName, variables) as GraphQLResponse;
  }

  async executeAndParse(
    options?: {
      filterByMarketId?: string;
      filterByEventTypes?: string[];
      includeAllEvents?: boolean;
    }
  ): Promise<ReturnType<typeof parseTransactions>> {
    const response = await this.execute();
    const transactions = response?.data?.getTransactions ?? [];
    return parseTransactions(transactions, options);
  }
}

export function buildQuery(operationName: string, fields?: string): QueryBuilder {
  return new QueryBuilder(operationName, fields);
}

export function buildUniversalQuery(
  operationName: string,
  whereClause: string,
  fields: string = UNIVERSAL_TRANSACTION_FIELDS
): string {
  return `
    query ${operationName} {
      getTransactions(
        where: {
          ${whereClause}
        }
      ) {
        ${fields}
      }
    }
  `
}

export class WhereClauseBuilder {
  private conditions: string[] = [];
  private eventConditions: string[] = [];
  private queryBuilder: QueryBuilder;

  constructor(queryBuilder: QueryBuilder) {
    this.queryBuilder = queryBuilder;
  }

  success(success: boolean = true): WhereClauseBuilder {
    this.conditions.push(`success: { eq: ${success} }`);
    return this;
  }
  
  blockHeightRange(min?: number, max?: number): WhereClauseBuilder {
    const conditions = [];
    if (min !== undefined) {
      conditions.push(`gt: ${min}`);
    }
    if (max !== undefined) {
      conditions.push(`lt: ${max}`);
    }
    if (conditions.length > 0) {
      this.conditions.push(`block_height: { ${conditions.join(', ')} }`);
    }
    return this;
  }
  
  eventType(eventType: string): WhereClauseBuilder {
    this.eventConditions.push(`type: { eq: "${eventType}" }`);
    return this;
  }
  
  marketId(marketId: string): WhereClauseBuilder {
    this.eventConditions.push(`attrs: { key: { eq: "market_id" }, value: { eq: "${marketId}" } }`);
    return this;
  }

  add(condition: string): WhereClauseBuilder {
    this.conditions.push(condition);
    return this;
  }

  build(): string {
    const allConditions = [...this.conditions];
    
    if (this.eventConditions.length > 0) {
      const eventCondition = `
        response: {
          events: {
            GnoEvent: {
              ${this.eventConditions.join('\n              ')}
            }
          }
        }
      `;
      allConditions.push(eventCondition);
    }
    
    return allConditions.filter(Boolean).join('\n          ');
  }

  reset(): WhereClauseBuilder {
    this.conditions = [];
    this.eventConditions = [];
    return this;
  }

  async execute(variables?: Record<string, unknown>): Promise<GraphQLResponse> {
    return this.queryBuilder.execute(variables);
  }

  async executeAndParse(
    options?: {
      filterByMarketId?: string;
      filterByEventTypes?: string[];
      includeAllEvents?: boolean;
    }
  ): Promise<ReturnType<typeof parseTransactions>> {
    return this.queryBuilder.executeAndParse(options);
  }
}

export function where(): WhereClauseBuilder {
  return new WhereClauseBuilder(new QueryBuilder("generic"));
}

export async function queryIndexer(
  query: string, 
  operationName: string, 
  variables?: Record<string, unknown>
): Promise<unknown> {
  try {
    const requestBody = { query, operationName, variables };
    
    const response = await axios.post(
      `${txIndexerUrl}/graphql/query`,
      requestBody,
      { headers: { 'Content-Type': 'application/json' } }
    )

    return response.data
  } catch (error) {
    console.error('Indexer query failed:', error)
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
    }
    throw error
  }
}

export function parseTransactions(
  transactions: Transaction[],
  options?: {
    filterByMarketId?: string;
    filterByEventTypes?: string[];
    includeAllEvents?: boolean;
  }
): {
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
  timestamp?: number; // ?
}[] {
  const results: ReturnType<typeof parseTransactions> = [];

  for (const tx of transactions) {
    // Safely extract base data - only include fields that exist
    const baseData: Partial<ReturnType<typeof parseTransactions>[0]> = {
      block_height: tx.block_height,
    };

    // Only add optional fields if they exist in the response
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
        // Skip if event type filtering is applied and doesn't match
        if (options?.filterByEventTypes && !options.filterByEventTypes.includes(event.type)) {
          continue;
        }

        // Skip if market ID filtering is applied and doesn't match
        if (options?.filterByMarketId) {
          const marketIdAttr = event.attrs?.find(a => a.key === "market_id");
          if (!marketIdAttr || marketIdAttr.value !== options.filterByMarketId) {
            continue;
          }
        }

        // Extract amount from attrs (prioritize 'amount', fallback to 'assets')
        const amountAttr = event.attrs?.find(a => a.key === "amount") || event.attrs?.find(a => a.key === "assets");
        const marketIdAttr = event.attrs?.find(a => a.key === "market_id");

        const eventData: Partial<ReturnType<typeof parseTransactions>[0]> = {
          ...baseData,
        };

        // Only add event fields if they exist in the response
        if (event.type !== undefined) eventData.event_type = event.type;
        if (event.func !== undefined) eventData.event_func = event.func;
        if (event.attrs !== undefined) eventData.event_attrs = event.attrs;
        if (amountAttr?.value !== undefined) eventData.amount = amountAttr.value;
        if (marketIdAttr?.value !== undefined) eventData.market_id = marketIdAttr.value;

        results.push(eventData as ReturnType<typeof parseTransactions>[0]);
      }
    } else if (options?.includeAllEvents !== false) {
      // If no events and we want to include transactions without events
      results.push(baseData as ReturnType<typeof parseTransactions>[0]);
    }
  }

  return results;
}

export function extractEventHistory(
  transactions: Transaction[],
  eventType: string,
  marketId?: string
): { amount: string; block_height: number; market_id?: string; caller?: string }[] {
  const parsed = parseTransactions(transactions, {
    filterByEventTypes: [eventType],
    filterByMarketId: marketId,
  });

  return parsed
    .filter(item => item.amount)
    .map(item => ({
      amount: item.amount!,
      block_height: item.block_height,
      market_id: item.market_id,
      caller: item.caller,
    }));
}

export function extractMarketActivity(
  transactions: Transaction[],
  marketId: string
): {
  block_height: number;
  type: string;
  amount: string | null;
  caller: string | null;
  tx_hash: string;
  func?: string;
}[] {
  const parsed = parseTransactions(transactions, {
    filterByMarketId: marketId,
  });

  return parsed.map(item => ({
    block_height: item.block_height,
    type: item.event_type ? item.event_type.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') : '',
    amount: item.amount || null,
    caller: item.caller || null,
    tx_hash: item.hash || '',
    func: item.event_func,
  }));
} 
