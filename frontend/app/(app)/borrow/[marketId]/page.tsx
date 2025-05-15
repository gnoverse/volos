"use client"

import "@/app/theme.css"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { InfoIcon } from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { formatUnits } from "viem"
import { MarketChart } from "../../../../components/market-chart"
import { useMarketHistoryQuery, useMarketQuery } from "../queries"

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl"

// Create a client
const queryClient = new QueryClient()

function MarketPageContent() {
  const params = useParams()
  const decodedMarketId = decodeURIComponent(params.marketId as string)
    
  const { data: market, isPending: marketLoading, error: marketError } = useMarketQuery(decodedMarketId)
  const { data: history, isPending: historyLoading, error: historyError } = useMarketHistoryQuery(decodedMarketId)

  const [apyVariations, setApyVariations] = useState({
    sevenDay: 0,
    ninetyDay: 0
  })

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      supplyAmount: "",
      borrowAmount: ""
    }
  })

  const supplyAmount = watch("supplyAmount")
  const borrowAmount = watch("borrowAmount")

  const supplyValue = supplyAmount ? 
    parseFloat(supplyAmount) * Number(formatUnits(BigInt(market?.currentPrice || "0"), 18)) : 0

  const borrowValue = borrowAmount ? 
    parseFloat(borrowAmount) : 0

  const onSubmit = (data: unknown) => {
    console.log("Form submitted:", data)
    // todo: send tx to the contract
  }

  const handleMaxSupply = () => {
    // todo: set true maximum value according to the user's balance (maybe use tokenhub)
    setValue("supplyAmount", "1000.00")
  }

  const handleMaxBorrow = () => {
    // todo: set true maximum value according to the user's balance
    setValue("borrowAmount", "500.00")
  }

  useEffect(() => {
    // Generate random variations for demo purposes
    // In a real app, this would come from the API
    setApyVariations({
      sevenDay: 1 + Math.random() * 0.1,
      ninetyDay: 1 - Math.random() * 0.1
    })
  }, [])

  if (marketLoading || historyLoading) {
    return <div>Loading market data...</div>
  }

  if (marketError || historyError) {
    return <div>Error loading market: {(marketError || historyError)?.message}</div>
  }

  if (!market || !history) {
    return <div>Market not found</div>
  }

  return (
    <div className="items-center justify-center space-y-6 -mt-6 py-6">
      <h1 className="text-[36px] font-bold mb-6 text-gray-200">
        {market.loanTokenSymbol} / {market.collateralTokenSymbol} Market
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative">
        {/* Left side - market information */}
        <div className="col-span-1 lg:col-span-3 space-y-6">
          {/* Market info cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            {/* Market Overview Card */}
            <Card className={CARD_STYLES}>
              <CardHeader className="pb-2">
                <CardTitle className="text-gray-200 flex items-center">
                  <span>Market Overview</span>
                  <div className="ml-auto px-3 py-1 bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-800/30 rounded-full text-xs font-medium flex items-center gap-1.5 text-gray-200">
                    <span className={`w-2 h-2 rounded-full ${market.isToken0Loan ? 'bg-blue-400' : 'bg-purple-400'}`}></span>
                    {market.isToken0Loan ? "Token0 Loan" : "Token1 Loan"}
                  </div>
                </CardTitle>
                <CardDescription className="text-gray-400">Basic information about the market</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 pt-2">
                {/* Loan Token */}
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                    <span className="text-blue-400 font-bold">{market.loanTokenSymbol.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-400">Loan Token</div>
                    <div className="font-medium text-gray-200 flex items-center">
                      {market.loanTokenName} 
                      <span className="ml-1 text-gray-400 text-xs">({market.loanTokenSymbol})</span>
                    </div>
                  </div>
                </div>
                
                {/* Collateral Token */}
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                    <span className="text-purple-400 font-bold">{market.collateralTokenSymbol.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-400">Collateral Token</div>
                    <div className="font-medium text-gray-200 flex items-center">
                      {market.collateralTokenName}
                      <span className="ml-1 text-gray-400 text-xs">({market.collateralTokenSymbol})</span>
                    </div>
                  </div>
                </div>
                
                {/* Price */}
                <div className="mt-2 pt-2 border-t border-gray-700/50">
                  <div className="text-sm text-gray-400 mb-1">Current Price</div>
                  <div className="flex items-baseline flex-wrap">
                    <span className="text-lg font-bold text-gray-200 break-all">
                      {Number(formatUnits(BigInt(market.currentPrice), 18)).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6
                      })}
                    </span>
                    <span className="ml-2 text-sm text-gray-400">
                      {market.loanTokenSymbol} per {market.collateralTokenSymbol}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Size Card */}
            <Card className={CARD_STYLES}>
              <CardHeader>
                <CardTitle className="text-gray-200">Market Size</CardTitle>
                <CardDescription className="text-gray-400">Supply and borrow information</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Supply</span>
                  <span className="font-medium text-gray-200">
                    {Number(formatUnits(BigInt(market.totalSupplyAssets), market.loanTokenDecimals)).toFixed(2)} {market.loanTokenSymbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Borrow</span>
                  <span className="font-medium text-gray-200">
                    {Number(formatUnits(BigInt(market.totalBorrowAssets), market.loanTokenDecimals)).toFixed(2)} {market.loanTokenSymbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Utilization</span>
                  <span className="font-medium text-gray-200">
                    {Number(formatUnits(BigInt(market.utilization), 18)).toFixed(2)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Parameters Card */}
            <Card className={CARD_STYLES}>
              <CardHeader>
                <CardTitle className="text-gray-200">Parameters</CardTitle>
                <CardDescription className="text-gray-400">Market parameters and rates</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Borrow APY</span>
                  <span className="font-medium text-gray-200">
                    {Number(formatUnits(BigInt(market.borrowRate), 18)).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Supply APY</span>
                  <span className="font-medium text-gray-200">
                    {Number(formatUnits(BigInt(market.supplyRate), 18)).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max LTV</span>
                  <span className="font-medium text-gray-200">
                    {(Number(formatUnits(BigInt(market.lltv), 18)) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fee</span>
                  <span className="font-medium text-gray-200">
                    {(Number(formatUnits(BigInt(market.fee), 18))).toFixed(2)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6">
            <MarketChart
              data={history}
              title="Total Supply"
              description="Total assets supplied to the market"
              dataKey="supply"
              color="rgba(34, 197, 94, 0.95)"
              className={CARD_STYLES}
            />
            <MarketChart
              data={history}
              title="Total Borrow"
              description="Total assets borrowed from the market"
              dataKey="borrow"
              color="rgba(239, 68, 68, 0.95)"
              className={CARD_STYLES}
            />
            <MarketChart
              data={history}
              title="Utilization Rate"
              description="Percentage of supplied assets being borrowed"
              dataKey="utilization"
              color="rgba(99, 102, 241, 0.95)"
              className={CARD_STYLES}
            />
            <MarketChart
              data={history}
              title="APY"
              description="Annual Percentage Yield"
              dataKey="apy"
              color="rgba(245, 158, 11, 0.95)"
              className={CARD_STYLES}
            />
          </div>

          {/* Performance Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className={CARD_STYLES}>
              <CardHeader>
                <CardTitle className="text-gray-200">7D APY</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-200">
                  {(Number(formatUnits(BigInt(market.borrowRate), 18)) * 100 * apyVariations.sevenDay).toFixed(2)}%
                </div>
              </CardContent>
            </Card>

            <Card className={CARD_STYLES}>
              <CardHeader>
                <CardTitle className="text-gray-200">30D APY</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-200">
                  {(Number(formatUnits(BigInt(market.borrowRate), 18)) * 100).toFixed(2)}%
                </div>
              </CardContent>
            </Card>

            <Card className={CARD_STYLES}>
              <CardHeader>
                <CardTitle className="text-gray-200">90D APY</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-200">
                  {(Number(formatUnits(BigInt(market.borrowRate), 18)) * 100 * apyVariations.ninetyDay).toFixed(2)}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-200">Risk</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className={CARD_STYLES}>
                <CardHeader>
                  <CardTitle className="text-gray-200 flex items-center gap-2">
                    Risk Rating by Credora ®
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-400">Has not been rated yet</div>
                </CardContent>
              </Card>

              <Card className={CARD_STYLES}>
                <CardHeader>
                  <CardTitle className="text-gray-200">Curator TVL</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-200 text-2xl font-bold">$578.40M</div>
                </CardContent>
              </Card>

              <Card className={CARD_STYLES}>
                <CardHeader>
                  <CardTitle className="text-gray-200">Vault Deployment Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-200">15/03/2024</div>
                </CardContent>
              </Card>

              <Card className={CARD_STYLES}>
                <CardHeader>
                  <CardTitle className="text-gray-200">Owner</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-200 font-mono">0x3300...f8c4</div>
                </CardContent>
              </Card>

              <Card className={CARD_STYLES}>
                <CardHeader>
                  <CardTitle className="text-gray-200">Curator Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-200 font-mono">0x0000...0000</div>
                </CardContent>
              </Card>

              <Card className={CARD_STYLES}>
                <CardHeader>
                  <CardTitle className="text-gray-200">Timelock / Guardian</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-200">1D / 0x0000...0000</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Disclosures Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
              Disclosures <InfoIcon className="h-4 w-4 text-gray-400" />
            </h2>
            <Card className={CARD_STYLES}>
              <CardContent className="">
                <p className="text-gray-400">Curator has not submitted a Disclosure.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right side - input cards */}
        <div className="col-span-1 lg:sticky top-6 self-start max-h-[calc(100vh-4rem)] overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Supply Card */}
            <Card className={CARD_STYLES}>
              <CardHeader className="">
                <CardTitle className="text-gray-200 text-base font-medium">
                  Supply Collateral {market.collateralTokenSymbol}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Input
                  type="number"
                  {...register("supplyAmount", { 
                    pattern: /^[0-9]*\.?[0-9]*$/
                  })}
                  className="text-4xl font-semibold text-gray-200 bg-transparent w-full border-none focus:outline-none p-0"
                  placeholder="0.00"
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">${supplyValue.toFixed(2)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">0.00 {market.collateralTokenSymbol}</span>
                    <button 
                      type="button" 
                      className="text-xs text-blue-500 font-medium"
                      onClick={handleMaxSupply}
                    >
                      MAX
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Borrow Card */}
            <Card className={CARD_STYLES}>
              <CardHeader className="">
                <CardTitle className="text-gray-200 text-base font-medium">
                  Borrow {market.loanTokenSymbol}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Input
                  type="number"
                  {...register("borrowAmount", { 
                    pattern: /^[0-9]*\.?[0-9]*$/
                  })}
                  className="text-4xl font-semibold text-gray-200 bg-transparent w-full border-none focus:outline-none p-0"
                  placeholder="0.00"
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">${borrowValue.toFixed(2)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">0.00 {market.loanTokenSymbol}</span>
                    <button 
                      type="button" 
                      className="text-xs text-blue-500 font-medium"
                      onClick={handleMaxBorrow}
                    >
                      MAX
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Position Card */}
            <Card className={CARD_STYLES}>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-400">My collateral position ({market.collateralTokenSymbol})</div>
                  <div className="text-xl font-semibold text-gray-200">0.00</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-400">My loan position ({market.loanTokenSymbol})</div>
                  <div className="text-xl font-semibold text-gray-200">0.00</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-400">LTV / Liquidation LTV</div>
                  <div className="text-xl font-semibold text-gray-200">
                    0% / {(Number(formatUnits(BigInt(market.lltv), 18)) * 100).toFixed(0)}%
                  </div>
                  
                  <div className="mt-2 relative">
                    <div className="h-2 bg-gray-600 rounded-full w-full"></div>
                    <div className="absolute left-0 top-0 w-1/2 h-full opacity-0">
                      <div className="absolute left-0 -top-1 h-4 w-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button
              type="submit" 
              className="w-full shadow-lg text-gray-200 rounded-2xl bg-midnightPurple-900 hover:bg-gradient-to-tr hover:from-midnightPurple-900 hover:to-midnightPurple-800 transition-all duration-300 text-md relative overflow-hidden hover:before:absolute hover:before:inset-0 hover:before:bg-gradient-to-tr hover:before:from-transparent hover:before:to-white/5 hover:before:animate-shine"
              disabled={!supplyAmount && !borrowAmount}
            >
              {!supplyAmount && !borrowAmount ? "Enter an amount" : "Submit Transaction"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function MarketPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <MarketPageContent />
    </QueryClientProvider>
  )
}
