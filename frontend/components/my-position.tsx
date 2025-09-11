"use client"

import { useMarketQuery, usePositionQuery } from "@/app/(app)/borrow/queries-mutations"
import { formatPercentage, wadToPercentage } from "@/app/utils/format.utils"
import { calculatePositionMetrics, toAssetsUp } from "@/app/utils/position.utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useUserAddress } from "@/hooks/use-user-address"
import { formatUnits } from "viem"
import { PositionChartTabs } from "./position-chart-tabs"


interface MarketPositionProps {
  marketId: string
  cardStyles: string
  caller: string
}

export function MyPosition({ 
  marketId,
  cardStyles, 
  caller
}: MarketPositionProps) {
  const { userAddress } = useUserAddress()
  const { data: market } = useMarketQuery(marketId)
  const { data: positionData } = usePositionQuery(marketId, userAddress!)

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
    BigInt(market?.total_borrow ?? '0'),
    BigInt(market?.total_borrow_shares ?? '0')
  )
  const currentCollateralBigInt = BigInt(positionData.collateral_supply)
  const positionMetrics = calculatePositionMetrics(positionData, market)

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
              {formatUnits(borrowAssets, market?.loan_token_decimals ?? 0)} 
              <span className="text-gray-400 text-lg ml-2">{market?.loan_token_symbol}</span>
            </div>
            <div className="text-sm text-gray-400 mt-2 break-words">
              ≈ ${formatUnits(borrowAssets, market?.loan_token_decimals ?? 0)} USD
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
                {formatUnits(BigInt(positionData.collateral_supply), market?.collateral_token_decimals ?? 0)}
              </span>
              <span className="text-gray-400 text-lg">{market?.collateral_token_symbol}</span>
            </div>
            <div className="text-sm text-gray-400 mt-2 break-words">
              ≈ ${formatUnits(currentCollateralBigInt, market?.collateral_token_decimals ?? 0)} USD
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
                  {formatPercentage(positionMetrics.ltv)}<span className="text-gray-400 text-sm">/ {formatPercentage(wadToPercentage(market?.lltv ?? "0"))}</span>
                </div>
              </div>
               </div>
          </CardContent>
        </Card>
      </div>

      {/* Position History Chart with Tabs */}
      <PositionChartTabs caller={caller} market={market!} marketId={market?.id || ''} cardStyles={cardStyles} />
    </div>
  )
} 
