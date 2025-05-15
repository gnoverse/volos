import { z } from "zod";

const Uint256Schema = z.string().regex(/^\d+$/, {
  message: "Must be a valid uint256 string representation",
});

export const PositionSchema = z.object({
  supplyShares: Uint256Schema,
  borrowShares: Uint256Schema,
  collateral: Uint256Schema,
});

export type Position = z.infer<typeof PositionSchema>;

export const MarketSchema = z.object({
  totalSupplyAssets: Uint256Schema,
  totalSupplyShares: Uint256Schema,
  totalBorrowAssets: Uint256Schema,
  totalBorrowShares: Uint256Schema,
  lastUpdate: z.number().int(),
  fee: Uint256Schema,
});

export type Market = z.infer<typeof MarketSchema>;

export const MarketParamsSchema = z.object({
  poolPath: z.string(),
  irm: z.string(),
  lltv: Uint256Schema,
  isToken0Loan: z.boolean(),
});

export type MarketParams = z.infer<typeof MarketParamsSchema>;

// Updated to match RpcMarketInfo structure from json.gno
export const MarketInfoSchema = z.object({
  // Market fields
  totalSupplyAssets: Uint256Schema,
  totalSupplyShares: Uint256Schema,
  totalBorrowAssets: Uint256Schema,
  totalBorrowShares: Uint256Schema,
  lastUpdate: z.number().int(),
  fee: Uint256Schema,
  
  // Params fields
  poolPath: z.string(),
  irm: z.string(),
  lltv: Uint256Schema,
  isToken0Loan: z.boolean(),
  
  // Additional fields
  loanToken: z.string(),
  collateralToken: z.string(),
  currentPrice: z.string(),
  borrowRate: Uint256Schema,
  supplyRate: Uint256Schema,
  utilization: Uint256Schema,
});

export type MarketInfo = z.infer<typeof MarketInfoSchema>;

export const ApiGetMarketResponseSchema = z.object({
  market: MarketSchema,
});

export type ApiGetMarketResponse = z.infer<typeof ApiGetMarketResponseSchema>;

export const ApiGetMarketParamsResponseSchema = z.object({
  params: MarketParamsSchema,
});

export type ApiGetMarketParamsResponse = z.infer<typeof ApiGetMarketParamsResponseSchema>;

export const ApiGetPositionResponseSchema = z.object({
  position: PositionSchema,
});

export type ApiGetPositionResponse = z.infer<typeof ApiGetPositionResponseSchema>;

export const ApiGetMarketInfoResponseSchema = z.object({
  marketInfo: MarketInfoSchema,
});

export type ApiGetMarketInfoResponse = z.infer<typeof ApiGetMarketInfoResponseSchema>;

export const ApiListMarketsResponseSchema = z.object({
  markets: z.array(
    z.record(z.string(), MarketSchema)
  ),
});

export type ApiListMarketsResponse = z.infer<typeof ApiListMarketsResponseSchema>;

export const ApiListMarketsInfoResponseSchema = z.object({
  markets: z.array(
    z.record(z.string(), MarketInfoSchema)
  ),
});

export type ApiListMarketsInfoResponse = z.infer<typeof ApiListMarketsInfoResponseSchema>;

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

export function parseValidatedMarket(jsonString: string): ApiGetMarketResponse {
  return parseAndValidateJson(jsonString, ApiGetMarketResponseSchema);
}

export function parseValidatedMarketParams(jsonString: string): ApiGetMarketParamsResponse {
  return parseAndValidateJson(jsonString, ApiGetMarketParamsResponseSchema);
}

export function parseValidatedPosition(jsonString: string): ApiGetPositionResponse {
  return parseAndValidateJson(jsonString, ApiGetPositionResponseSchema);
}

export function parseValidatedMarketInfo(jsonString: string): ApiGetMarketInfoResponse {
  return parseAndValidateJson(jsonString, ApiGetMarketInfoResponseSchema);
}

export function parseValidatedMarketsList(jsonString: string): ApiListMarketsResponse {
  return parseAndValidateJson(jsonString, ApiListMarketsResponseSchema);
}

export function parseValidatedMarketsInfoList(jsonString: string): ApiListMarketsInfoResponse {
  return parseAndValidateJson(jsonString, ApiListMarketsInfoResponseSchema);
} 