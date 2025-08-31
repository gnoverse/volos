import { z } from "zod";

const Uint256Schema = z.string().regex(/^\d+$/, {
  message: "Must be a valid uint256 string representation",
});

// Chart and history data types
export const ChartDataSchema = z.object({
  value: z.number(),
  timestamp: z.date(),
});

export const MarketHistorySchema = z.object({
  timestamp: z.date(),
  value: Uint256Schema,
  delta: Uint256Schema,
  operation: z.string(),
  caller: z.string(),
  tx_hash: z.string(),
  event_type: z.string(),
});

export const APRDataSchema = z.object({
  timestamp: z.date(),
  supply_apr: z.number(),
  borrow_apr: z.number(),
});

export const TotalSupplyDataSchema = z.object({
  delta: Uint256Schema,
  operation: z.string(),
  event_type: z.string(),
  timestamp: z.date(),
  value: Uint256Schema,
  caller: z.string(),
  tx_hash: z.string(),
});

export const TotalBorrowDataSchema = z.object({
  delta: Uint256Schema,
  operation: z.string(),
  event_type: z.string(),
  timestamp: z.date(),
  value: Uint256Schema,
  caller: z.string(),
  tx_hash: z.string(),
});

export const TotalCollateralSupplyDataSchema = z.object({
  delta: Uint256Schema,
  operation: z.string(),
  event_type: z.string(),
  timestamp: z.date(),
  value: Uint256Schema,
  caller: z.string(),
  tx_hash: z.string(),
});

export const UtilizationDataSchema = z.object({
  timestamp: z.date(),
  value: z.number(),
});

export const MarketSnapshotSchema = z.object({
  market_id: z.string(),
  timestamp: z.date(),
  resolution: z.enum(['4hour', 'daily', 'weekly']),
  supply_apr: z.number(),
  borrow_apr: z.number(),
  total_supply: Uint256Schema,
  total_collateral_supply: Uint256Schema,
  total_borrow: Uint256Schema,
  utilization_rate: z.number(),
  created_at: z.date(),
});

// User types
export const UserSchema = z.object({
  address: z.string(),
  dao_member: z.boolean(),
  staked_vls: z.record(z.string(), z.number()),
  created_at: z.string().nullable(),
});

export const UserLoanHistorySchema = z.object({
  value: Uint256Schema,
  timestamp: z.date(),
  marketId: z.string(),
  eventType: z.string(),
  operation: z.string(),
  loan_token_symbol: z.string(),
  collateral_token_symbol: z.string(),
});

// Governance types
export const ProposalSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  proposer: z.string(),
  deadline: z.string(),
  status: z.string(),
  created_at: z.string(),
  last_vote: z.string(),
  yes_votes: z.number(),
  no_votes: z.number(),
  abstain_votes: z.number(),
  total_votes: z.number(),
  quorum: z.number(),
});

export const ProposalsResponseSchema = z.object({
  proposals: z.array(ProposalSchema),
  has_more: z.boolean(),
  last_id: z.string(),
});

export const UserVoteSchema = z.object({
  proposal_id: z.string(),
  voter: z.string(),
  vote_choice: z.string(),
  reason: z.string(),
  xvls_amount: z.number(),
  timestamp: z.string(),
});

export const PendingUnstakeSchema = z.object({
  amount: z.number(),
  delegatee: z.string(),
  unlock_at: z.string(),
});

// Market types
export const MarketSchema = z.object({
  id: z.string(),
  loan_token: z.string(),
  collateral_token: z.string(),
  loan_token_name: z.string(),
  loan_token_symbol: z.string(),
  loan_token_decimals: z.number(),
  collateral_token_name: z.string(),
  collateral_token_symbol: z.string(),
  collateral_token_decimals: z.number(),
  total_supply: Uint256Schema,
  total_borrow: Uint256Schema,
  total_collateral_supply: Uint256Schema,
  supply_apr: z.number(),
  borrow_apr: z.number(),
  utilization_rate: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const MarketsResponseSchema = z.object({
  markets: z.array(MarketSchema),
  has_more: z.boolean(),
  last_id: z.string(),
});

export const MarketActivityResponseSchema = z.object({
  activities: z.array(MarketHistorySchema),
  has_more: z.boolean(),
  last_id: z.string(),
});



// Updated to match RpcMarketInfo structure from json.gno
export const MarketInfoSchema = z.object({
  // Market fields
  totalSupplyAssets: Uint256Schema,
  totalSupplyShares: Uint256Schema,
  totalBorrowAssets: Uint256Schema,
  totalBorrowShares: Uint256Schema,
  lastUpdate: z.number().int(),
  fee: z.number(),
  
  // Params fields
  poolPath: z.string(),
  irm: z.string(),
  lltv: z.number(),
  isToken0Loan: z.boolean(),
  
  // Additional fields
  loanToken: z.string(),
  collateralToken: z.string(),
  currentPrice: z.string(),
  borrowAPR: z.number(),
  supplyAPR: z.number(),
  utilization: z.number(),
  
  // Token information fields
  loanTokenName: z.string(),
  loanTokenSymbol: z.string(),
  loanTokenDecimals: z.number().int(),
  
  collateralTokenName: z.string(),
  collateralTokenSymbol: z.string(),
  collateralTokenDecimals: z.number().int(),
  
  marketId: z.string().optional(), //todo when implemented
});

// Governance User Info
export const GovernanceUserInfoSchema = z.object({
  address: z.string(),
  vlsBalance: z.number(),
  xvlsBalance: z.number(),
  proposalThreshold: z.number(),
  isMember: z.boolean(),
});

// -------------- listing responses & parsing functions for them
export const HealthFactorSchema = z.object({
  healthFactor: z.string(),
});

// Type exports
export type ChartData = z.infer<typeof ChartDataSchema>;
export type MarketHistory = z.infer<typeof MarketHistorySchema>;
export type APRData = z.infer<typeof APRDataSchema>;
export type TotalSupplyData = z.infer<typeof TotalSupplyDataSchema>;
export type TotalBorrowData = z.infer<typeof TotalBorrowDataSchema>;
export type TotalCollateralSupplyData = z.infer<typeof TotalCollateralSupplyDataSchema>;
export type UtilizationData = z.infer<typeof UtilizationDataSchema>;
export type MarketSnapshot = z.infer<typeof MarketSnapshotSchema>;
export type User = z.infer<typeof UserSchema>;
export type UserLoan = z.infer<typeof UserLoanHistorySchema>;
export type Proposal = z.infer<typeof ProposalSchema>;
export type ProposalsResponse = z.infer<typeof ProposalsResponseSchema>;
export type UserVote = z.infer<typeof UserVoteSchema>;
export type PendingUnstake = z.infer<typeof PendingUnstakeSchema>;
export type Market = z.infer<typeof MarketSchema>;
export type MarketsResponse = z.infer<typeof MarketsResponseSchema>;
export type MarketActivityResponse = z.infer<typeof MarketActivityResponseSchema>;
export type MarketInfo = z.infer<typeof MarketInfoSchema>;
export type GovernanceUserInfo = z.infer<typeof GovernanceUserInfoSchema>;
export type HealthFactor = z.infer<typeof HealthFactorSchema>;

// Utility functions
export function parseAndValidateJson<T>(jsonString: string, schema: z.ZodType<T>): T {
  try {
    const parsed = JSON.parse(jsonString);
    return schema.parse(parsed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.format());
    } else {
      console.error("JSON parsing error:", error);
    }
    throw error;
  }
}
