"use client"

import { AdenaService } from "@/app/services/adena.service"
import "@/app/theme.css"
import {
  formatApyVariation,
  formatLTV,
  formatRate,
  formatTokenAmount,
  formatUtilization
} from "@/app/utils/format.utils"
import { AddBorrowPanel } from "@/components/add-borrow-panel"
import { InfoCard } from "@/components/InfoCard"
import { MarketChart } from "@/components/market-chart"
import { RepayWithdrawPanel } from "@/components/repay-withdraw-panel"
import { SupplyPanel } from "@/components/supply-panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import {
  borrowValue,
  supplyValue
} from "../mock"
import { useApproveTokenMutation, useHealthFactorQuery, useLoanAmountQuery, useMarketHistoryQuery, useMarketQuery, usePositionQuery, useSupplyMutation } from "../queries-mutations"
import { handleMaxBorrow, handleMaxSupply } from "./handlers"

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl"

const queryClient = new QueryClient()

function MarketPageContent() {
  const [tab, setTab] = useState("add-borrow")
  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      supplyAmount: "",
      borrowAmount: "",
      repayAmount: "",
      withdrawAmount: ""
    }
  })
  const [apyVariations, ] = useState({
    sevenDay: 0,
    ninetyDay: 0
  })
  const params = useParams()
  const supplyMutation = useSupplyMutation()
  const approveTokenMutation = useApproveTokenMutation()
  const decodedMarketId = decodeURIComponent(params.marketId as string)
  const { data: market, isPending: marketLoading, error: marketError } = useMarketQuery(decodedMarketId)
  const { data: history, isPending: historyLoading, error: historyError } = useMarketHistoryQuery(decodedMarketId)
  const [userAddress, setUserAddress] = useState<string>("")
  const { data: positionData } = usePositionQuery(decodedMarketId, userAddress);

  const supplyAmount = watch("supplyAmount")
  const borrowAmount = watch("borrowAmount")

  const { data: loanAmountData } = useLoanAmountQuery(decodedMarketId, userAddress)
  const { data: healthFactorData } = useHealthFactorQuery(decodedMarketId, userAddress)

  const currentLoan = loanAmountData ? parseFloat(loanAmountData.amount) : 0
  const currentCollateral = positionData ? parseFloat(positionData.collateral) : 0

  const onSubmit = async (data : { 
    supplyAmount: string, 
    borrowAmount: string,
    repayAmount: string,
    withdrawAmount: string 
  }) => {
    const { supplyAmount, borrowAmount, repayAmount, withdrawAmount } = data;
    
    if (supplyAmount && parseFloat(supplyAmount) > 0) {
      try {
        const loanTokenPath = market?.loanToken;
        const approvalAmount = parseFloat(supplyAmount);
        
        await approveTokenMutation.mutateAsync({
          tokenPath: loanTokenPath!,
          amount: approvalAmount *2
        });
                
        supplyMutation.mutate({
          marketId: decodedMarketId,
          assets: parseFloat(supplyAmount)
        }, {
          onSuccess: () => {
            setValue("supplyAmount", "");
          },
          onError: (error: Error) => {
            console.error(`Failed to supply: ${error.message}`);
          }
        });
      } catch (error) {
        console.error(`Failed to approve token: ${(error as Error).message}`);
      }
    }
    
    if (borrowAmount && parseFloat(borrowAmount) > 0) {
      console.log("Borrowing:", borrowAmount);
    }
    
    if (repayAmount && parseFloat(repayAmount) > 0) {
      console.log("Repaying:", repayAmount);
    }
    
    if (withdrawAmount && parseFloat(withdrawAmount) > 0) {
      console.log("Withdrawing:", withdrawAmount);
    }
  }

  const isTransactionPending = supplyMutation.isPending

  useEffect(() => {
    reset()
  }, [tab, reset])

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
                <div className="mt-2 pt-2 border-t border-gray-700/50">
                  <div className="text-sm text-gray-400 mb-1">Current Price</div>
                  <div className="flex items-baseline flex-wrap">
                    <span className="text-lg font-bold text-gray-200 break-all">
                      {formatTokenAmount(market.currentPrice, 18, 2, 6)}
                      <span className="ml-2 text-sm text-gray-400">
                        {market.loanTokenSymbol} per {market.collateralTokenSymbol}
                      </span>
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
                        <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full"></div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 ml-2">Medium</span>
                  </div>
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
            <InfoCard
              title="7D APY"
              value={formatApyVariation(market.borrowAPR, apyVariations.sevenDay, 18, 2)}
            />
            <InfoCard
              title="30D APY"
              value={formatApyVariation(market.borrowAPR, 1, 18, 2)}
            />
            <InfoCard
              title="90D APY"
              value={formatApyVariation(market.borrowAPR, apyVariations.ninetyDay, 18, 2)}
            />
          </div>
        </div>

        {/* Right side - tabbed interface */}
        <div className="col-span-1 lg:col-span-3 lg:sticky top-0 self-start pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <Tabs value={tab} onValueChange={setTab} className="w-full sticky top-0 z-10 backdrop-blur-sm">
            <TabsList className="mb-4 w-full py-2">
              <TabsTrigger value="add-borrow">Add / Borrow</TabsTrigger>
              <TabsTrigger value="repay-withdraw">Repay / Withdraw</TabsTrigger>
              <TabsTrigger value="supply-only">Supply</TabsTrigger>
            </TabsList>
            
            <TabsContent value="add-borrow">
              <AddBorrowPanel 
                market={market}
                onSubmitAction={onSubmit}
                supplyAmount={supplyAmount}
                borrowAmount={borrowAmount}
                supplyValue={supplyValue}
                borrowValue={borrowValue}
                isTransactionPending={isTransactionPending}
                handleMaxSupplyAction={() => handleMaxSupply(setValue)}
                handleMaxBorrowAction={() => handleMaxBorrow(setValue, supplyAmount, 0)}
                registerAction={register}
                setValue={setValue}
                handleSubmitAction={handleSubmit}
                healthFactor={healthFactorData?.healthFactor ?? "0"}
                currentCollateral={currentCollateral}
                currentLoan={currentLoan}
                watch={watch}
                ltv={market.lltv}
                collateralTokenDecimals={market.collateralTokenDecimals}
                loanTokenDecimals={market.loanTokenDecimals}
              />
            </TabsContent>
            
            <TabsContent value="repay-withdraw">
              <RepayWithdrawPanel 
                market={market}
                onSubmitAction={onSubmit}
                supplyAmount={supplyAmount}
                borrowAmount={borrowAmount}
                supplyValue={supplyValue}
                borrowValue={borrowValue}
                isTransactionPending={isTransactionPending}
                handleMaxSupplyAction={() => handleMaxSupply(setValue)}
                handleMaxBorrowAction={() => handleMaxBorrow(setValue, supplyAmount, 0)}
                registerAction={register}
                setValue={setValue}
                handleSubmitAction={handleSubmit}
                healthFactor={healthFactorData?.healthFactor ?? "0"}
                currentCollateral={currentCollateral}
                currentLoan={currentLoan}
                watch={watch}
                ltv={market.lltv}
                collateralTokenDecimals={market.collateralTokenDecimals}
                loanTokenDecimals={market.loanTokenDecimals}
              />
            </TabsContent>
            
            <TabsContent value="supply-only">
              <SupplyPanel 
                market={market}
                onSubmitAction={onSubmit}
                supplyAmount={supplyAmount}
                supplyValue={supplyValue}
                isTransactionPending={isTransactionPending}
                handleMaxSupplyAction={() => handleMaxSupply(setValue)}
                registerAction={register}
                setValue={setValue}
                handleSubmitAction={handleSubmit}
                healthFactor={healthFactorData?.healthFactor ?? "0"}
                currentCollateral={currentCollateral}
                currentLoan={currentLoan}
                watch={watch}
                ltv={market.lltv}
                collateralTokenDecimals={market.collateralTokenDecimals}
                loanTokenDecimals={market.loanTokenDecimals}
              />
            </TabsContent>
          </Tabs>
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
