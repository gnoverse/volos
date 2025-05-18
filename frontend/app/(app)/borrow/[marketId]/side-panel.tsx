"use client"

import { MarketInfo, Position } from "@/app/types"
import { AddBorrowPanel } from "@/components/add-borrow-panel"
import { RepayWithdrawPanel } from "@/components/repay-withdraw-panel"
import { SupplyPanel } from "@/components/supply-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type FormValues = {
  supplyAmount: string
  borrowAmount: string
  repayAmount: string
  withdrawAmount: string
}
interface SidePanelProps {
  tab: string
  setTabAction: (tab: string) => void
  market: MarketInfo
  supplyValue: number
  borrowValue: number
  onSubmitAction: (data: FormValues) => void
  isTransactionPending: boolean
  healthFactor: string
  currentCollateral: number
  currentLoan: number
  ltv: string
  collateralTokenDecimals: number
  loanTokenDecimals: number
  positionData?: Position
}

export function SidePanel({
  tab,
  setTabAction,
  market,
  onSubmitAction,
  supplyValue,
  borrowValue,
  isTransactionPending,
  healthFactor,
  currentCollateral,
  currentLoan,
  ltv,
  collateralTokenDecimals,
  loanTokenDecimals,
  positionData,
}: SidePanelProps) {
  return (
    <div className="col-span-1 lg:col-span-3 lg:sticky top-0 self-start pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
      <Tabs value={tab} onValueChange={setTabAction} className="w-full sticky top-0 z-10 backdrop-blur-sm">
        <TabsList className="mb-4 w-full py-2">
          <TabsTrigger value="add-borrow">Add / Borrow</TabsTrigger>
          <TabsTrigger value="repay-withdraw">Repay / Withdraw</TabsTrigger>
          <TabsTrigger value="supply-only">Supply</TabsTrigger>
        </TabsList>
        
        <TabsContent value="add-borrow">
          <AddBorrowPanel 
            market={market}
            onSubmitAction={onSubmitAction}
            supplyValue={supplyValue}
            borrowValue={borrowValue}
            isTransactionPending={isTransactionPending}
            healthFactor={healthFactor}
            currentCollateral={currentCollateral}
            currentLoan={currentLoan}
            positionData={positionData}
            ltv={ltv}
            collateralTokenDecimals={collateralTokenDecimals}
            loanTokenDecimals={loanTokenDecimals}
          />
        </TabsContent>
        
        <TabsContent value="repay-withdraw">
          <RepayWithdrawPanel 
            market={market}
            onSubmitAction={onSubmitAction}
            supplyValue={supplyValue}
            borrowValue={borrowValue}
            isTransactionPending={isTransactionPending}
            healthFactor={healthFactor}
            currentCollateral={currentCollateral}
            currentLoan={currentLoan}
            ltv={ltv}
            collateralTokenDecimals={collateralTokenDecimals}
            loanTokenDecimals={loanTokenDecimals}
          />
        </TabsContent>
        
        <TabsContent value="supply-only">
          <SupplyPanel 
            market={market}
            onSubmitAction={onSubmitAction}
            supplyValue={supplyValue}
            isTransactionPending={isTransactionPending}
            healthFactor={healthFactor}
            currentCollateral={currentCollateral}
            currentLoan={currentLoan}
            ltv={ltv}
            collateralTokenDecimals={collateralTokenDecimals}
            loanTokenDecimals={loanTokenDecimals}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
} 