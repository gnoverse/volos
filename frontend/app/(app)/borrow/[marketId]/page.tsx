"use client"

import { useUserAddress } from "@/app/utils/address.utils"
import { MarketDashboard } from "@/components/market-dashboard"
import { MarketTabs } from "@/components/market-tabs"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { useState } from "react"
//import { SidePanel } from "../../../../components/side-panel"
import { useHealthFactorQuery, useMarketQuery, usePositionQuery, useUserLoanHistoryQuery } from "../queries-mutations"

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl"
const queryClient = new QueryClient()

function MarketPageContent() {
  const params = useParams<{ marketId: string }>()
  const marketId = decodeURIComponent(params.marketId)

  const [apyVariations] = useState({ sevenDay: 0, ninetyDay: 0 })
  //const [tab, setTab] = useState("add-borrow") side panel related
  const { userAddress } = useUserAddress()

  const { data: marketInfo, isLoading: isMarketLoading } = useMarketQuery(marketId)
  const { data: healthFactorData } = useHealthFactorQuery(marketId, userAddress)
  const { data: userLoanHistory } = useUserLoanHistoryQuery(userAddress)
  const { data: positionData } = usePositionQuery(marketId, userAddress)

  // Take the latest value from the loan history (or "0" if empty)
  const currentLoan = userLoanHistory && userLoanHistory.length > 0 ? userLoanHistory[userLoanHistory.length - 1].value : "0";

  return (
    <div className="items-center justify-center space-y-6 -mt-6 py-6 relative">
      <h1 className="text-[36px] font-bold mb-6 text-gray-300">
        {!isMarketLoading && marketInfo
          ? `${marketInfo.loanTokenSymbol} / ${marketInfo.collateralTokenSymbol.toUpperCase()} Market`
          : <span className="animate-pulse bg-gray-700 rounded-xl w-96 h-15 inline-block mt-4" />}
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 relative">
        {/* Left side - market information */}
        <div className="col-span-1 lg:col-span-9 space-y-6">
          {/* Market info cards */}
          {!isMarketLoading && marketInfo ? (
            <MarketDashboard 
              market={marketInfo}
              cardStyles={CARD_STYLES}
            />
          ) : (
            <div className="h-40 bg-gray-700/60 rounded-3xl animate-pulse" />
          )}

          {/* Tabbed content */}
          {!isMarketLoading && marketInfo ? (
            <MarketTabs 
              market={marketInfo} 
              apyVariations={apyVariations} 
              cardStyles={CARD_STYLES}
              healthFactor={healthFactorData?.healthFactor ?? "0"}
              currentLoan={currentLoan}
              positionData={positionData}
              caller={userAddress}
            />
          ) : (
            <div className="h-128 bg-gray-700/60 rounded-3xl animate-pulse" />
          )}
        </div>

        {/* Right side - tabbed interface
        {!isMarketLoading && marketInfo ? (
          <SidePanel
            tab={tab}
            setTabAction={setTab}
            market={marketInfo}
            supplyValue={0} // TODO: Get from position data
            borrowValue={0} // TODO: Get from position data  
            healthFactor={healthFactorData?.healthFactor ?? "0"}
            currentCollateral={0} // TODO: Get from position data
            currentLoan={currentLoan}
            ltv={marketInfo.lltv.toString()}
            collateralTokenDecimals={marketInfo.collateralTokenDecimals}
            loanTokenDecimals={marketInfo.loanTokenDecimals}
            positionData={positionData}
          />
        ) : (
          <div className="lg:col-span-3 h-174 bg-gray-700/60 rounded-3xl animate-pulse" />
        )} */}
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
