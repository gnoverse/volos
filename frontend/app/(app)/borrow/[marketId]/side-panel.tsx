"use client"

import { MarketInfo, Position } from "@/app/types"
import { AddBorrowPanel } from "@/components/add-borrow-panel"
import { RepayWithdrawPanel } from "@/components/repay-withdraw-panel"
import { SupplyPanel } from "@/components/supply-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowRightIcon, CirclePlusIcon, PlusIcon } from "lucide-react"

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
      <div className="w-full sticky top-0 z-10 backdrop-blur-sm">        
        <Tabs value={tab} onValueChange={setTabAction} className="w-full">
          <div className="flex">
            <div className="flex-grow">
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
            </div>
            
            <div className="ml-4">
              <TooltipProvider>
                <TabsList className="flex-col h-auto bg-customGray-800/60 rounded-lg p-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="add-borrow" 
                        className="p-2 mb-1 data-[state=active]:shadow-md data-[state=active]:text-white !data-[state=active]:bg-gray-600/70 !data-[state=active]:scale-110 !data-[state=active]:font-medium transition-all duration-200"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      Add / Borrow
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="repay-withdraw" 
                        className="p-2 mb-1 data-[state=active]:shadow-md data-[state=active]:text-white !data-[state=active]:bg-gray-600/70 !data-[state=active]:scale-110 !data-[state=active]:font-medium transition-all duration-200"
                      >
                        <ArrowRightIcon className="w-4 h-4" />
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      Repay / Withdraw
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="supply-only" 
                        className="p-2 data-[state=active]:shadow-md data-[state=active]:text-white !data-[state=active]:bg-gray-600/70 !data-[state=active]:scale-110 !data-[state=active]:font-medium transition-all duration-200"
                      >
                        <CirclePlusIcon className="w-4 h-4" />
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      Supply
                    </TooltipContent>
                  </Tooltip>
                </TabsList>
              </TooltipProvider>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  )
} 