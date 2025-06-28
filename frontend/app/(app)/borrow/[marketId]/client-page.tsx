// app/(app)/borrow/[marketId]/client-page.tsx (Client Component)
"use client"

import { AdenaService } from "@/app/services/adena.service"
import { ChartData, MarketActivity } from "@/app/services/indexer/utils/types.indexer"
import "@/app/theme.css"
import { MarketInfo } from "@/app/types"
import { parseTokenAmount } from "@/app/utils/format.utils"
import { MarketDashboard } from "@/components/market-dashboard"
import { MarketTabs } from "@/components/market-tabs"
import { Button } from "@/components/ui/button"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"
import { SidePanel } from "../../../../components/side-panel"
import {
  borrowValue,
  supplyValue
} from "../mock"
import { MarketHistory } from "../mock-history"
import { useHealthFactorQuery, useLoanAmountQuery, usePositionQuery } from "../queries-mutations"

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl"
const queryClient = new QueryClient()

interface MarketPageClientProps {
  marketId: string;
  marketInfo: MarketInfo;
  mockHistory: MarketHistory[];
  netSupplyHistory: ChartData[];
  netBorrowHistory: ChartData[];
  marketActivity: MarketActivity[];
  apyVariations: {
    sevenDay: number;
    ninetyDay: number;
  };
}

function MarketPageContent({ 
  marketId, 
  marketInfo, 
  mockHistory, 
  netSupplyHistory, 
  netBorrowHistory, 
  marketActivity,
  apyVariations 
}: MarketPageClientProps) {
  const [tab, setTab] = useState("add-borrow")
  const [userAddress, setUserAddress] = useState<string>("")
  
  const { data: positionData, refetch: refetchPosition } = usePositionQuery(marketId, userAddress);
  const { data: loanAmountData, refetch: refetchLoanAmount } = useLoanAmountQuery(marketId, userAddress)
  const { data: healthFactorData, refetch: refetchHealthFactor } = useHealthFactorQuery(marketId, userAddress)

  const currentLoan = loanAmountData ? parseTokenAmount(loanAmountData.amount, marketInfo?.loanTokenDecimals) : 0
  const currentCollateral = positionData ? parseTokenAmount(positionData.collateral, 6) : 0 // 6 is just for demo purposes

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

  const handleRefetch = () => {
    refetchPosition();
    refetchLoanAmount();
    refetchHealthFactor();
  };

  return (
    <div className="items-center justify-center space-y-6 -mt-6 py-6 relative">
      {/* Refetch button in top right corner */}
      <Button 
        onClick={handleRefetch}
        className="absolute top-0 right-0 mt-2 mr-2 p-3 bg-gray-700/60 rounded-lg hover:bg-gray-600/80 transition-colors flex items-center gap-2 z-10"
        title="Refetch data"
        variant="outline"
      >
        <RefreshCw size={20} className="text-gray-200" />
        <span className="text-sm text-gray-200 font-medium">Refetch Data</span>
      </Button>

      <h1 className="text-[36px] font-bold mb-6 text-gray-200">
        {marketInfo.loanTokenSymbol} / {marketInfo.collateralTokenSymbol.toUpperCase()} Market
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 relative">
        {/* Left side - market information */}
        <div className="col-span-1 lg:col-span-9 space-y-6">
          {/* Market info cards */}
          <MarketDashboard 
            market={marketInfo}
            cardStyles={CARD_STYLES}
          />

          {/* Tabbed content */}
          <MarketTabs 
            history={mockHistory} 
            market={marketInfo} 
            apyVariations={apyVariations} 
            cardStyles={CARD_STYLES}
            healthFactor={healthFactorData?.healthFactor ?? "0"}
            currentCollateral={currentCollateral}
            currentLoan={currentLoan}
            positionData={positionData}
            netSupplyHistory={netSupplyHistory}
            netBorrowHistory={netBorrowHistory}
            marketActivity={marketActivity}
          />
        </div>

        {/* Right side - tabbed interface */}
        <SidePanel
          tab={tab}
          setTabAction={setTab}
          market={marketInfo}
          supplyValue={supplyValue}
          borrowValue={borrowValue}
          healthFactor={healthFactorData?.healthFactor ?? "0"}
          currentCollateral={currentCollateral}
          currentLoan={currentLoan}
          ltv={marketInfo.lltv}
          collateralTokenDecimals={marketInfo.collateralTokenDecimals}
          loanTokenDecimals={marketInfo.loanTokenDecimals}
          positionData={positionData}
        />
      </div>
    </div>
  )
}

export function MarketPageClient(props: MarketPageClientProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <MarketPageContent {...props} />
    </QueryClientProvider>
  )
}
