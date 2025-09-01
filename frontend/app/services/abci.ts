import {
  GovernanceUserInfo,
  GovernanceUserInfoSchema,
  HealthFactor,
  HealthFactorSchema,
  Market,
  MarketInfo,
  MarketInfoSchema,
  MarketSchema,
  Position,
  PositionSchema,
  Balance,
  BalanceSchema,
} from "../types"
import { parseValidatedJsonResult } from "../utils/parsing.utils"
import { GnoService } from "./abci.service"

const REALM_PATH = "gno.land/r/volos/core"
const GOVERNANCE_REALM_PATH = "gno.land/r/volos/gov/governance"
const XVLS_REALM_PATH = "gno.land/r/volos/gov/xvls"
const gnoService = GnoService.getInstance()

// GNO LEND API QUERIES

export async function apiGetMarket(marketId: string): Promise<Market> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `ApiGetMarket("${marketId}")`,
    )
    return parseValidatedJsonResult(result, MarketSchema)
  } catch (error) {
    console.error('Error fetching market API data:', error)
    throw error
  }
}

export async function apiGetPosition(marketId: string, userAddr: string): Promise<Position> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `ApiGetPosition("${marketId}", "${userAddr}")`,
    )
    return parseValidatedJsonResult(result, PositionSchema)
  } catch (error) {
    console.error('Error fetching position API data:', error)
    throw error
  }
}

export async function apiGetMarketInfo(marketId: string): Promise<MarketInfo> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `ApiGetMarketInfo("${marketId}")`,
    )
    return parseValidatedJsonResult(result, MarketInfoSchema)
  } catch (error) {
    console.error('Error fetching market info:', error)
    throw error
  }
}

export async function apiGetHealthFactor(marketId: string, userAddr: string): Promise<HealthFactor> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `ApiGetHealthFactor("${marketId}", "${userAddr}")`,
    )
    return parseValidatedJsonResult(result, HealthFactorSchema)
  } catch (error) {
    console.error('Error fetching health factor:', error)
    throw error
  }
}

// GOVERNANCE API QUERIES

export async function apiGetUserInfo(userAddr: string): Promise<GovernanceUserInfo> {
  try {
    const result = await gnoService.evaluateExpression(
      GOVERNANCE_REALM_PATH,
      `ApiGetUserInfo("${userAddr}")`,
    )
    return parseValidatedJsonResult(result, GovernanceUserInfoSchema)
  } catch (error) {
    console.error('Error fetching user governance info:', error)
    throw error
  }
}

export async function apiGetXVLSBalance(userAddr: string): Promise<Balance> {
  try {
    const result = await gnoService.evaluateExpression(
      XVLS_REALM_PATH,
      `ApiGetBalance("${userAddr}")`,
    )
    const balanceData = parseValidatedJsonResult(result, BalanceSchema)
    return balanceData
  } catch (error) {
    console.error('Error fetching xVLS balance:', error)
    throw error
  }
}
