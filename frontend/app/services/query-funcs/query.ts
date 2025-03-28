import { GnoService } from "../abci.service"

const REALM_PATH = "gno.land/stefann/gnolend"
const gnoService = GnoService.getInstance()

// Position Getters
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

// Market Getters
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
    const match = result.match(/\((\d+)\s+int64\)/)
    if (!match) {
      throw new Error('Invalid market last update format')
    }
    return parseInt(match[1], 10)
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

// Market Params Getters
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

// List Getters
export async function getMarketList(): Promise<string[]> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `GetMarketList()`,
    )
    return parseStringArrayResult(result)
  } catch (error) {
    console.error('Error fetching market list:', error)
    throw error
  }
}

export async function getPositionList(marketId: string): Promise<string[]> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `GetPositionList("${marketId}")`,
    )
    return parseStringArrayResult(result)
  } catch (error) {
    console.error('Error fetching position list:', error)
    throw error
  }
}

export async function getIRMList(): Promise<string[]> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `GetIRMList()`,
    )
    return parseStringArrayResult(result)
  } catch (error) {
    console.error('Error fetching IRM list:', error)
    throw error
  }
}

export async function getEnabledIRMList(): Promise<string[]> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `GetEnabledIRMList()`,
    )
    return parseStringArrayResult(result)
  } catch (error) {
    console.error('Error fetching enabled IRM list:', error)
    throw error
  }
}

export async function getEnabledLLTVList(): Promise<string[]> {
  try {
    const result = await gnoService.evaluateExpression(
      REALM_PATH,
      `GetEnabledLLTVList()`,
    )
    return parseStringArrayResult(result)
  } catch (error) {
    console.error('Error fetching enabled LLTV list:', error)
    throw error
  }
}

// Price Getter
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

// Convenience Getters
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

// TODO: test these

// Helper functions to parse results
function parseStringResult(result: string): string {
  const match = result.match(/\("([^"]+)"\s+string\)/)
  if (!match) {
    throw new Error('Invalid string result format')
  }
  return match[1]
}

function parseStringArrayResult(result: string): string[] {
  // This handles parsing of a []string result from Gno
  // Example format: ([]string) [elem1 elem2 elem3]
  const match = result.match(/\(\[\]string\)\s+\[(.*)\]/)
  if (!match) {
    return []
  }
  
  if (!match[1] || match[1].trim() === '') {
    return []
  }
  
  // Split by spaces but respect quotes
  const elements: string[] = []
  const regex = /"([^"]*)"|\S+/g
  let m
  
  while ((m = regex.exec(match[1])) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++
    }
    
    elements.push(m[1] || m[0])
  }
  
  return elements
} 
