import { GnoService } from "../abci.service"
import {
  ApiGetMarketInfoResponse,
  ApiGetMarketInfoResponseSchema,
  ApiGetMarketParamsResponse,
  ApiGetMarketParamsResponseSchema,
  ApiGetMarketResponse,
  ApiGetMarketResponseSchema,
  ApiGetPositionResponse,
  ApiGetPositionResponseSchema,
  ApiListMarketsInfoResponse,
  ApiListMarketsInfoResponseSchema,
  ApiListMarketsResponse,
  ApiListMarketsResponseSchema,
} from "../types"
import { parseStringResult, parseValidatedJsonResult } from "../util"

const REALM_PATH = "gno.land/r/gnolend"
const gnoService = GnoService.getInstance()

export async function apiGetMarket(marketId: string): Promise<ApiGetMarketResponse> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `ApiGetMarket("${marketId}")`,
    )
    return parseValidatedJsonResult(result, ApiGetMarketResponseSchema)
  } catch (error) {
    console.error('Error fetching market API data:', error)
    throw error
  }
}

export async function apiGetMarketParams(marketId: string): Promise<ApiGetMarketParamsResponse> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `ApiGetMarketParams("${marketId}")`,
    )
    return parseValidatedJsonResult(result, ApiGetMarketParamsResponseSchema)
  } catch (error) {
    console.error('Error fetching market params API data:', error)
    throw error
  }
}

export async function apiGetPosition(marketId: string, userAddr: string): Promise<ApiGetPositionResponse> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `ApiGetPosition("${marketId}", "${userAddr}")`,
    )
    return parseValidatedJsonResult(result, ApiGetPositionResponseSchema)
  } catch (error) {
    console.error('Error fetching position API data:', error)
    throw error
  }
}

export async function apiListMarkets(): Promise<ApiListMarketsResponse> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `ApiListMarkets()`,
    )
    return parseValidatedJsonResult(result, ApiListMarketsResponseSchema)
  } catch (error) {
    console.error('Error fetching markets list API data:', error)
    throw error
  }
}

export async function apiGetMarketInfo(marketId: string): Promise<ApiGetMarketInfoResponse> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `ApiGetMarketInfo("${marketId}")`,
    )
    return parseValidatedJsonResult(result, ApiGetMarketInfoResponseSchema)
  } catch (error) {
    console.error('Error fetching market info:', error)
    throw error
  }
}

export async function apiListMarketsInfo(): Promise<ApiListMarketsInfoResponse> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `ApiListMarketsInfo()`,
    )
    return parseValidatedJsonResult(result, ApiListMarketsInfoResponseSchema)
  } catch (error) {
    console.error('Error fetching markets info list:', error)
    throw error
  }
}

export async function getFeeRecipient(): Promise<string> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `GetFeeRecipient()`,
    )
    return parseStringResult(result)
  } catch (error) {
    console.error('Error fetching fee recipient:', error)
    throw error
  }
}