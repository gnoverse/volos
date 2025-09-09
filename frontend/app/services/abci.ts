import {
  Balance,
  BalanceSchema,
  GovernanceUserInfo,
  GovernanceUserInfoSchema,
} from "../types"
import { parseABCIResponse, parseValidatedJsonResult } from "../utils/parsing.utils"
import { GnoService } from "./abci.service"

const GOVERNANCE_REALM_PATH = "gno.land/r/volos/gov/governance"
const XVLS_REALM_PATH = "gno.land/r/volos/gov/xvls"
const gnoService = GnoService.getInstance()


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

export async function getTokenBalance(tokenPath: string, userAddress: string): Promise<string> {
  try {
    const result = await gnoService.evaluateExpression(
      tokenPath,
      `BalanceOf("${userAddress}")`,
    )
    return parseABCIResponse(result, 'int64')
  } catch (error) {
    console.error('Error fetching token balance:', error)
    throw error
  }
}
