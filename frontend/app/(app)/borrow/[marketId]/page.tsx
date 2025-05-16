"use client"

import "@/app/theme.css"
import { MarketActionForms } from "@/components/market-action-forms"
import { MarketChart } from "@/components/market-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { InfoIcon } from "lucide-react"
import { useParams } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { formatUnits } from "viem"
import { useApproveTokenMutation, useMarketHistoryQuery, useMarketQuery, useSupplyMutation } from "../queries-mutations"

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl"

const queryClient = new QueryClient()

function MarketPageContent() {
  const { register, handleSubmit, setValue, watch } = useForm({
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

  const supplyAmount = watch("supplyAmount")
  const borrowAmount = watch("borrowAmount")

  const mockExchangeRate = 0.000001
  
  const supplyValue = supplyAmount ? 
    parseFloat(supplyAmount) * mockExchangeRate : 0

  const borrowValue = borrowAmount ? 
    parseFloat(borrowAmount) * mockExchangeRate : 0
    
  const maxBorrowableAmount = supplyAmount ? 
    parseFloat(supplyAmount) * 
    Number(formatUnits(BigInt(market?.currentPrice || "0"), 18)) * 
    Number(formatUnits(BigInt(market?.lltv || "0"), 18)) : 0
    
  const isBorrowValid = !!(borrowAmount && supplyAmount && 
    parseFloat(borrowAmount) > 0 && 
    parseFloat(borrowAmount) <= maxBorrowableAmount)
    
  const isTransactionValid = !!(
    (supplyAmount && parseFloat(supplyAmount) > 0) || 
    isBorrowValid
  )

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
    
    if (borrowAmount && parseFloat(borrowAmount) > 0 && isBorrowValid) {
      console.log("Borrowing:", borrowAmount);
    }
    
    if (repayAmount && parseFloat(repayAmount) > 0) {
      console.log("Repaying:", repayAmount);
    }
    
    if (withdrawAmount && parseFloat(withdrawAmount) > 0) {
      console.log("Withdrawing:", withdrawAmount);
    }
  }

  const handleMaxSupply = () => {
    // todo: set true maximum value according to the user's balance (maybe use tokenhub)
    setValue("supplyAmount", "1000.00")
  }

  const handleMaxBorrow = () => {
    if (supplyAmount && parseFloat(supplyAmount) > 0) {
      setValue("borrowAmount", maxBorrowableAmount.toFixed(2))
    } else {
      setValue("borrowAmount", "0.00")
    }
  }

  const isTransactionPending = supplyMutation.isPending

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

        {/* Right side - tabbed interface */}
        <div className="col-span-1 lg:col-span-3 lg:sticky top-0 self-start pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <Tabs defaultValue="add-borrow" className="w-full sticky top-0 z-10 backdrop-blur-sm">
            <TabsList className="mb-4 w-full py-2">
              <TabsTrigger value="add-borrow">Add / Borrow</TabsTrigger>
              <TabsTrigger value="repay-withdraw">Repay / Withdraw</TabsTrigger>
              <TabsTrigger value="supply-only">Supply</TabsTrigger>
            </TabsList>
            
            <TabsContent value="add-borrow">
              <MarketActionForms 
                market={market}
                formType="add-borrow"
                onSubmitAction={onSubmit}
                supplyAmount={supplyAmount}
                borrowAmount={borrowAmount}
                supplyValue={supplyValue}
                borrowValue={borrowValue}
                maxBorrowableAmount={maxBorrowableAmount}
                isBorrowValid={isBorrowValid}
                isTransactionValid={isTransactionValid}
                isTransactionPending={isTransactionPending}
                handleMaxSupplyAction={handleMaxSupply}
                handleMaxBorrowAction={handleMaxBorrow}
                registerAction={register}
                setValue={setValue}
                handleSubmitAction={handleSubmit}
              />
            </TabsContent>
            
            <TabsContent value="repay-withdraw">
              <MarketActionForms 
                market={market}
                formType="repay-withdraw"
                onSubmitAction={onSubmit}
                supplyAmount={supplyAmount}
                borrowAmount={borrowAmount}
                supplyValue={supplyValue}
                borrowValue={borrowValue}
                maxBorrowableAmount={maxBorrowableAmount}
                isBorrowValid={isBorrowValid}
                isTransactionValid={isTransactionValid}
                isTransactionPending={isTransactionPending}
                handleMaxSupplyAction={handleMaxSupply}
                handleMaxBorrowAction={handleMaxBorrow}
                registerAction={register}
                setValue={setValue}
                handleSubmitAction={handleSubmit}
              />
            </TabsContent>
            
            <TabsContent value="supply-only">
              <MarketActionForms 
                market={market}
                formType="supply-only"
                onSubmitAction={onSubmit}
                supplyAmount={supplyAmount}
                borrowAmount={borrowAmount}
                supplyValue={supplyValue}
                borrowValue={borrowValue}
                maxBorrowableAmount={maxBorrowableAmount}
                isBorrowValid={isBorrowValid}
                isTransactionValid={isTransactionValid}
                isTransactionPending={isTransactionPending}
                handleMaxSupplyAction={handleMaxSupply}
                handleMaxBorrowAction={handleMaxBorrow}
                registerAction={register}
                setValue={setValue}
                handleSubmitAction={handleSubmit}
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
