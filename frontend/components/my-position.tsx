"use client"

import { usePositionQuery } from "@/app/(app)/borrow/queries-mutations"
import { Market } from "@/app/types"
import { formatPercentage, formatPrice, wadToPercentage } from "@/app/utils/format.utils"
import { calculatePositionMetrics, toAssetsUp } from "@/app/utils/position.utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useUserAddress } from "@/hooks/use-user-address"
import { formatUnits } from "viem"
import { PositionChartTabs } from "./position-chart-tabs"


interface MyPositionProps {
  market: Market
  cardStyles: string
  caller: string
}

export function MyPosition({ 
  market,
  cardStyles, 
  caller
}: MyPositionProps) {
  const { userAddress } = useUserAddress()
  const { data: positionData } = usePositionQuery(market.id, userAddress!)

  const hasPosition = positionData && (
    BigInt(positionData.collateral_supply) > BigInt(0) || 
    BigInt(positionData.borrow_shares) > BigInt(0)
  )

  if (!hasPosition) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center text-gray-400 p-8">
        <div className="text-2xl mb-4">No Active Position</div>
        <p className="text-center max-w-md">
          You don&apos;t have any active positions in this market. Use the panel on the right to supply collateral and borrow assets.
        </p>
      </div>
    )
  }

  const currentBorrowShares = BigInt(positionData.borrow_shares)
  const borrowAssets = toAssetsUp(
    currentBorrowShares,
    BigInt(market.total_borrow),
    BigInt(market.total_borrow_shares)
  )
  const currentCollateralBigInt = BigInt(positionData.collateral_supply)
  const positionMetrics = calculatePositionMetrics(positionData, market!)

  // Calculate formatted price for USD value display
  // Price decimals: 36 + loan_token_decimals - collateral_token_decimals
  const priceDecimals = 36 + (market.loan_token_decimals) - (market.collateral_token_decimals);
  const formattedPrice = parseFloat(formatPrice(market.current_price, priceDecimals, market.loan_token_decimals));
  
  // Calculate collateral USD value
  const collateralAmount = parseFloat(formatUnits(currentCollateralBigInt, market.collateral_token_decimals));
  const collateralUsdValue = (collateralAmount * formattedPrice).toFixed(2);
  
  // Calculate borrowed assets USD value (loan token price is 1:1 with USD since it's the base currency)
  const borrowedAmount = parseFloat(formatUnits(borrowAssets, market.loan_token_decimals));
  const borrowedUsdValue = borrowedAmount.toFixed(2);

  return (
    <div className="space-y-6">
      {/* Position Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className={cardStyles}>
          <CardHeader className="">
            <CardTitle className="text-logo-600">Borrowed</CardTitle>
            <CardDescription className="text-gray-400">Your borrowed assets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-200">
              {formatUnits(borrowAssets, market.loan_token_decimals)} 
              <span className="text-gray-400 text-lg ml-2">{market.loan_token_symbol}</span>
            </div>
            <div className="text-sm text-gray-400 mt-2 break-words">
              ≈ ${borrowedUsdValue} USD
            </div>
          </CardContent>
        </Card>

        <Card className={cardStyles}>
          <CardHeader className="">
            <CardTitle className="text-logo-600">Collateral</CardTitle>
            <CardDescription className="text-gray-400">Your supplied collateral</CardDescription>
          </CardHeader>
          <CardContent className="items-center">
            <div className="text-2xl font-bold text-gray-200 flex flex-wrap items-baseline break-all ">
              <span className="break-all mr-2">
                {formatUnits(BigInt(positionData.collateral_supply), market.collateral_token_decimals)}
              </span>
              <span className="text-gray-400 text-lg">{market.collateral_token_symbol}</span>
            </div>
            <div className="text-sm text-gray-400 mt-2 break-words">
              ≈ ${collateralUsdValue} USD
            </div>
          </CardContent>
        </Card>

        <Card className={cardStyles}>
          <CardHeader className="">
            <CardTitle className="text-logo-600">Health</CardTitle>
            <CardDescription className="text-gray-400">Position health metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Current LTV</div>
                <div className="text-xl font-medium text-gray-200">
                  {formatPercentage(positionMetrics.ltv)}<span className="text-gray-400 text-sm">/ {formatPercentage(wadToPercentage(market.lltv))}</span>
                </div>
              </div>
               </div>
          </CardContent>
        </Card>
      </div>

      {/* Position History Chart with Tabs */}
      <PositionChartTabs caller={caller} market={market} marketId={market?.id} cardStyles={cardStyles} />
    </div>
  )
} 
