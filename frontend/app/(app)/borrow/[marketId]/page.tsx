"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useParams } from "next/navigation"
import { formatUnits } from "viem"
import { assets } from "../mock"

export default function MarketPage() {
  const params = useParams()
  const decodedMarketId = decodeURIComponent(params.marketId as string)
  const market = assets.find((asset) => asset.id === decodedMarketId)

  console.log(params.marketId)

  if (!market) {
    return <div>Market not found</div>
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">
        {market.loanSymbol} / {market.collateralSymbol} Market
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Market Overview</CardTitle>
            <CardDescription>Basic information about the market</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Loan Token</span>
              <span className="font-medium">{market.loanSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Collateral Token</span>
              <span className="font-medium">{market.collateralSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Price</span>
              <span className="font-medium">
                {Number(formatUnits(BigInt(market.price), 18)).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market Size</CardTitle>
            <CardDescription>Supply and borrow information</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Supply</span>
              <span className="font-medium">
                {Number(formatUnits(BigInt(market.totalSupplyAssets), 18)).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Borrow</span>
              <span className="font-medium">
                {Number(formatUnits(BigInt(market.totalBorrowAssets), 18)).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Utilization</span>
              <span className="font-medium">
                {(Number(formatUnits(BigInt(market.totalBorrowAssets), 18)) / 
                  Number(formatUnits(BigInt(market.totalSupplyAssets), 18)) * 100).toFixed(2)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parameters</CardTitle>
            <CardDescription>Market parameters and rates</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div className="flex justify-between">
              <span className="text-gray-400">APY</span>
              <span className="font-medium text-green-500">{market.apy}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Max LTV</span>
              <span className="font-medium">
                {(Number(formatUnits(BigInt(market.lltv), 18)) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Fee</span>
              <span className="font-medium">
                {(Number(formatUnits(BigInt(market.fee), 18))).toFixed(2)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
