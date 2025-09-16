import {
  Balance,
  BalanceSchema,
  GovernanceUserInfo,
  GovernanceUserInfoSchema,
} from "../types"
import { parseABCIResponse, parseValidatedJsonResult } from "../utils/parsing.utils"
import { GnoService } from "./abci.service"
import { VOLOS_ADDRESS } from "./tx.service"

const GOVERNANCE_REALM_PATH = "gno.land/r/volos/gov/governance"
const XVLS_REALM_PATH = "gno.land/r/volos/gov/xvls"
const CORE_REALM_PATH = "gno.land/r/volos/core"
const gnoService = GnoService.getInstance()

export async function apiGetUserInfo(userAddr: string): Promise<GovernanceUserInfo> {
  try {
    const result = await gnoService.evaluateExpression(
      GOVERNANCE_REALM_PATH,
      `ApiGetUserInfo("${userAddr}")`,
    )
    return parseValidatedJsonResult(result, GovernanceUserInfoSchema)
  } catch (error) {
    console.error(error)
    return { address: userAddr, vlsBalance: 0, xvlsBalance: 0, proposalThreshold: 0, isMember: false }
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
    console.error(error)
    return { address: userAddr, balance: 0 }
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
    console.error(error)
    return "0"
  }
}

export async function getAllowance(tokenPath: string, userAddress: string): Promise<string> {
  try {
    const result = await gnoService.evaluateExpression(
      tokenPath,
      `Allowance("${userAddress}", "${VOLOS_ADDRESS}")`,
    )
    return parseABCIResponse(result, 'int64')
  } catch (error) {
    console.error(error)
    return "0"
  }
}

export async function getExpectedBorrowAssets(marketId: string, userAddress: string): Promise<string> {
  try {
    const result = await gnoService.evaluateExpression(
      CORE_REALM_PATH,
      `GetExpectedBorrowAssets("${marketId}", "${userAddress}")`,
    )
    return parseABCIResponse(result, 'string')
  } catch (error) {
    console.error(error)
    return "0"
  }
}
