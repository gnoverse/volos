// TODO: which fields require ? and which don't?
export type GnoEventAttr = { key: string; value: string }

export type GnoEvent = { type: string; func?: string; attrs: GnoEventAttr[] }

export type MsgCall = { 
  caller: string; 
  send?: string; 
  pkg_path?: string; 
  func?: string; 
  args?: string[] 
}
export type TransactionMessage = {
  typeUrl?: string;
  route?: string;
  value?: MsgCall;
}

export type Transaction = { 
  block_height: number; 
  index?: number;
  hash?: string; 
  messages?: TransactionMessage[];
  response: { events: GnoEvent[] }
}

export type GraphQLResponse = {
  data?: {
    getTransactions?: Transaction[]
  }
}

export type TransactionData = {
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
}

// ------------------------------------------------------------ TYPES NEEDED FOR SPECIFIC COMPONENTS ------------------------------------------------------------

// charts
export type ChartData = {
  value: number;
  timestamp?: number;
}

// market activity data table
export type MarketActivity = {
  block_height: number;
  type: string;
  amount: string | null;
  caller: string | null;
  tx_hash: string;
  func?: string;
  timestamp: number;
}
