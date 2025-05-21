"use client"

import { AdenaService } from "@/app/services/adena.service"
import "@/app/theme.css"
import {
  formatLTV,
  formatRate,
  formatTokenAmount,
  formatUtilization
} from "@/app/utils/format.utils"
import { MarketTabs } from "@/components/market-tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import {
  borrowValue,
  supplyValue
} from "../mock"
import { useHealthFactorQuery, useLoanAmountQuery, useMarketHistoryQuery, useMarketQuery, usePositionQuery } from "../queries-mutations"
import { SidePanel } from "./side-panel"

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl"

const queryClient = new QueryClient()

function MarketPageContent() {
  const [tab, setTab] = useState("add-borrow")

  const [apyVariations, ] = useState({
    sevenDay: 0,
    ninetyDay: 0
  })
  const params = useParams()
  const decodedMarketId = decodeURIComponent(params.marketId as string)
  const { data: market, isPending: marketLoading, error: marketError } = useMarketQuery(decodedMarketId)
  const { data: history, isPending: historyLoading, error: historyError } = useMarketHistoryQuery(decodedMarketId)
  const [userAddress, setUserAddress] = useState<string>("")
  const { data: positionData } = usePositionQuery(decodedMarketId, userAddress);

  const { data: loanAmountData } = useLoanAmountQuery(decodedMarketId, userAddress)
  const { data: healthFactorData } = useHealthFactorQuery(decodedMarketId, userAddress)

  const currentLoan = loanAmountData ? parseFloat(loanAmountData.amount) : 0
  const currentCollateral = positionData ? parseFloat(positionData.collateral) : 0
  // track user address
  useEffect(() => {
    const adena = AdenaService.getInstance()
    setUserAddress(adena.getAddress())

    const handleAddressChange = (event: CustomEvent) => {
      setUserAddress(event.detail?.newAddress || "")
    }
    window.addEventListener("adenaAddressChanged", handleAddressChange as EventListener)

    return () => {
      window.removeEventListener("adenaAddressChanged", handleAddressChange as EventListener)
    }
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
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 relative">
        {/* Left side - market information */}
        <div className="col-span-1 lg:col-span-9 space-y-6">
          {/* Market info cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            {/* Market Overview Card */}
            <Card className={CARD_STYLES}>
              <CardHeader className="pb-2">
                <CardTitle className="text-gray-200 flex items-center">
                  <span>Market Overview</span>
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
                <div className="mt-2 pt-2 border-t border-gray-700/50 flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-400">Current Price</div>
                    <span className="text-xs font-light text-gray-400">
                      ({market.loanTokenSymbol} / {market.collateralTokenSymbol})
                    </span>
                  </div>
                  <div className="flex items-baseline flex-wrap">
                    <span className="text-3xl font-bold text-gray-200 break-all">
                      {formatTokenAmount(market.currentPrice, 18, 2, 6)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Size Card */}
            <Card className={CARD_STYLES}>
              <CardHeader className="pb-2">
                <CardTitle className="text-gray-200 flex items-center">
                  <span>Market Size</span>
                </CardTitle>
                <CardDescription className="text-gray-400">Supply and borrow information</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 pt-2">
                {/* Total Supply */}
                <div>
                  <div className="text-sm text-gray-400 mb-1">Total Supply</div>
                  <div className="text-3xl font-bold text-gray-200">
                    {formatTokenAmount(market.totalSupplyAssets, market.loanTokenDecimals)} <span className="text-gray-400 text-lg">{market.loanTokenSymbol}</span>
                  </div>
                </div>
                
                {/* Total Borrow */}
                <div>
                  <div className="text-sm text-gray-400 mb-1">Total Borrow</div>
                  <div className="text-3xl font-bold text-gray-200">
                    {formatTokenAmount(market.totalBorrowAssets, market.loanTokenDecimals)} <span className="text-gray-400 text-lg">{market.loanTokenSymbol}</span>
                  </div>
                </div>
                
                {/* Utilization Visualization */}
                <div className="mt-2 pt-2 border-t border-gray-700/50">
                  <div className="text-sm text-gray-400 mb-2">Utilization Rate</div>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-800 rounded-full h-2.5">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-400 h-2.5 rounded-full" 
                        style={{ width: `${Math.min(Number(formatTokenAmount(market.utilization, 18)), 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-200 whitespace-nowrap">
                      {formatUtilization(market.utilization)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Parameters Card */}
            <Card className={CARD_STYLES}>
              <CardHeader className="pb-2">
                <CardTitle className="text-gray-200 flex items-center">
                  <span>Parameters</span>
                </CardTitle>
                <CardDescription className="text-gray-400">Market parameters and rates</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 pt-2">
                {/* APY Rates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Supply APY</div>
                    <div className="text-xl font-medium text-gray-200">
                      {formatRate(market.supplyAPR, 18)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Borrow APY</div>
                    <div className="text-xl font-medium text-gray-200">
                      {formatRate(market.borrowAPR, 18)}
                    </div>
                  </div>
                </div>
                
                {/* Risk Parameters */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Max LTV</div>
                    <div className="text-xl font-medium text-gray-200">
                      {formatLTV(market.lltv, 18)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Fee</div>
                    <div className="text-xl font-medium text-gray-200">
                      {formatRate(market.fee, 18)}
                    </div>
                  </div>
                </div>
                
                {/* Health Factor Indicator */}
                <div className="mt-2 pt-2 border-t border-gray-700/50">
                  <div className="text-sm text-gray-400 mb-1">Risk Level</div>
                  <div className="relative flex items-center gap-2">
                    <div className="flex-1 h-6 flex items-center justify-center relative">
                      <div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-md"
                        style={{
                          width: "3px", 
                          height: "60%",
                          backgroundColor: "rgb(209 213 219)",
                          borderRadius: "2px",
                          zIndex: 2
                        }}
                      />
                      <div
                        className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2"
                        style={{
                          zIndex: 1,
                          marginLeft: "0.75rem",
                          marginRight: "0.75rem"
                        }}
                      >
                        <div className="h-full bg-gradient-to-r from-transparent via-yellow-600 to-red-500 rounded-full"></div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 ml-2">Medium</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabbed content */}
          <MarketTabs 
            history={history} 
            market={market} 
            apyVariations={apyVariations} 
            cardStyles={CARD_STYLES}
            healthFactor={healthFactorData?.healthFactor ?? "0"}
            currentCollateral={currentCollateral}
            currentLoan={currentLoan}
            positionData={positionData}
          />
        </div>

        {/* Right side - tabbed interface */}
        <SidePanel
          tab={tab}
          setTabAction={setTab}
          market={market}
          supplyValue={supplyValue}
          borrowValue={borrowValue}
          healthFactor={healthFactorData?.healthFactor ?? "0"}
          currentCollateral={currentCollateral}
          currentLoan={currentLoan}
          ltv={market.lltv}
          collateralTokenDecimals={market.collateralTokenDecimals}
          loanTokenDecimals={market.loanTokenDecimals}
          positionData={positionData}
        />
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
