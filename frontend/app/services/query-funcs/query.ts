import { GnoService } from "../abci.service"
import { parseJsonResult, parseNumberResult, parseStringResult } from "../util"

const REALM_PATH = "gno.land/r/gnolend"
const gnoService = GnoService.getInstance()

export async function getPositionSupplyShares(marketId: string, userAddr: string): Promise<string> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `GetPositionSupplyShares("${marketId}", "${userAddr}")`,
    )
    return parseStringResult(result)
  } catch (error) {
    console.error('Error fetching position supply shares:', error)
    throw error
  }
}

export async function getPositionBorrowShares(marketId: string, userAddr: string): Promise<string> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `GetPositionBorrowShares("${marketId}", "${userAddr}")`,
    )
    return parseStringResult(result)
  } catch (error) {
    console.error('Error fetching position borrow shares:', error)
    throw error
  }
}

export async function getPositionCollateral(marketId: string, userAddr: string): Promise<string> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `GetPositionCollateral("${marketId}", "${userAddr}")`,
    )
    return parseStringResult(result)
  } catch (error) {
    console.error('Error fetching position collateral:', error)
    throw error
  }
}

export async function getMarketTotalSupplyAssets(marketId: string): Promise<string> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `GetMarketTotalSupplyAssets("${marketId}")`,
    )
    return parseStringResult(result)
  } catch (error) {
    console.error('Error fetching market total supply assets:', error)
    throw error
  }
}

export async function getMarketTotalSupplyShares(marketId: string): Promise<string> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `GetMarketTotalSupplyShares("${marketId}")`,
    )
    return parseStringResult(result)
  } catch (error) {
    console.error('Error fetching market total supply shares:', error)
    throw error
  }
}

export async function getMarketTotalBorrowAssets(marketId: string): Promise<string> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `GetMarketTotalBorrowAssets("${marketId}")`,
    )
    return parseStringResult(result)
  } catch (error) {
    console.error('Error fetching market total borrow assets:', error)
    throw error
  }
}

export async function getMarketTotalBorrowShares(marketId: string): Promise<string> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `GetMarketTotalBorrowShares("${marketId}")`,
    )
    return parseStringResult(result)
  } catch (error) {
    console.error('Error fetching market total borrow shares:', error)
    throw error
  }
}

export async function getMarketLastUpdate(marketId: string): Promise<number> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `GetMarketLastUpdate("${marketId}")`,
    )
    return parseNumberResult(result)
  } catch (error) {
    console.error('Error fetching market last update:', error)
    throw error
  }
}

export async function getMarketFee(marketId: string): Promise<string> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `GetMarketFee("${marketId}")`,
    )
    return parseStringResult(result)
  } catch (error) {
    console.error('Error fetching market fee:', error)
    throw error
  }
}

export async function getMarketParamsLoanToken(marketId: string): Promise<string> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `GetMarketParamsLoanToken("${marketId}")`,
    )
    return parseStringResult(result)
  } catch (error) {
    console.error('Error fetching market params loan token:', error)
    throw error
  }
}

export async function getMarketParamsCollateralToken(marketId: string): Promise<string> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `GetMarketParamsCollateralToken("${marketId}")`,
    )
    return parseStringResult(result)
  } catch (error) {
    console.error('Error fetching market params collateral token:', error)
    throw error
  }
}

export async function getMarketParamsPoolPath(marketId: string): Promise<string> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `GetMarketParamsPoolPath("${marketId}")`,
    )
    return parseStringResult(result)
  } catch (error) {
    console.error('Error fetching market params pool path:', error)
    throw error
  }
}

export async function getMarketParamsIRM(marketId: string): Promise<string> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `GetMarketParamsIRM("${marketId}")`,
    )
    return parseStringResult(result)
  } catch (error) {
    console.error('Error fetching market params IRM:', error)
    throw error
  }
}

export async function getMarketParamsLLTV(marketId: string): Promise<string> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `GetMarketParamsLLTV("${marketId}")`,
    )
    return parseStringResult(result)
  } catch (error) {
    console.error('Error fetching market params LLTV:', error)
    throw error
  }
}

export async function getMarketPrice(marketId: string): Promise<string> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `GetMarketPrice("${marketId}")`,
    )
    return parseStringResult(result)
  } catch (error) {
    console.error('Error fetching market price:', error)
    throw error
  }
}

export async function getSupplyShares(marketId: string, userAddr: string): Promise<string> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `GetSupplyShares("${marketId}", gnolland.AddressFromString("${userAddr}"))`,
    )
    return parseStringResult(result)
  } catch (error) {
    console.error('Error fetching supply shares:', error)
    throw error
  }
}

export async function getBorrowShares(marketId: string, userAddr: string): Promise<string> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `GetBorrowShares("${marketId}", gnolland.AddressFromString("${userAddr}"))`,
    )
    return parseStringResult(result)
  } catch (error) {
    console.error('Error fetching borrow shares:', error)
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

export async function apiGetMarket(marketId: string): Promise<string> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `ApiGetMarket("${marketId}")`,
    )
    return parseJsonResult(result)
  } catch (error) {
    console.error('Error fetching market API data:', error)
    throw error
  }
}

export async function apiGetMarketParams(marketId: string): Promise<string> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `ApiGetMarketParams("${marketId}")`,
    )
    return parseJsonResult(result)
  } catch (error) {
    console.error('Error fetching market params API data:', error)
    throw error
  }
}

export async function apiGetPosition(marketId: string, userAddr: string): Promise<string> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `ApiGetPosition("${marketId}", "${userAddr}")`,
    )
    return parseJsonResult(result)
  } catch (error) {
    console.error('Error fetching position API data:', error)
    throw error
  }
}

export async function apiListMarkets(): Promise<string> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `ApiListMarkets()`,
    )
    return parseJsonResult(result)
  } catch (error) {
    console.error('Error fetching markets list API data:', error)
    throw error
  }
}

export async function getRender(path: string = ""): Promise<string> {
  try {
    const rendered = await gnoService.getRender(REALM_PATH, path)
    return rendered
  } catch (error) {
    console.error('Error getting render output:', error)
    throw error
  }
} 
