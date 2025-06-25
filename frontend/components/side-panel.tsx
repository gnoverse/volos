"use client"

import { MarketInfo, Position } from "@/app/types"
import { AddBorrowPanel } from "@/components/add-borrow-panel"
import { RepayWithdrawPanel } from "@/components/repay-withdraw-panel"
import { SupplyPanel } from "@/components/supply-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SidePanelProps {
  tab: string
  setTabAction: (tab: string) => void
  market: MarketInfo
  supplyValue: number
  borrowValue: number
  healthFactor: string
  currentCollateral?: number
  currentLoan?: number
  ltv: string
  collateralTokenDecimals: number
  loanTokenDecimals: number
  positionData?: Position
}

export function SidePanel({
  tab,
  setTabAction,
  market,
  supplyValue,
  borrowValue,
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
          <div className="flex justify-center mb-1">
            <TabsList className="flex flex-row bg-customGray-800/60 rounded-lg p-1 w-full">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value="add-borrow" 
                      className={`flex-1 py-1 transition-all duration-200 ${tab === "add-borrow" ? "shadow-md text-white bg-gray-600/70 font-medium" : ""}`}
                    >
                      Borrow
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Borrow/Supply collateral</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value="repay-withdraw" 
                      className={`flex-1 py-1 transition-all duration-200 ${tab === "repay-withdraw" ? "shadow-md text-white bg-gray-600/70 font-medium" : ""}`}
                    >
                      Repay
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Repay/Withdraw collateral</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value="supply-only" 
                      className={`flex-1 py-1 transition-all duration-200 ${tab === "supply-only" ? "shadow-md text-white bg-gray-600/70 font-medium" : ""}`}
                    >
                      Supply
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Supply loan token to the market</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TabsList>
          </div>

          <div className="flex">
            <div className="flex-grow">
              <TabsContent value="add-borrow">
                <AddBorrowPanel 
                  market={market}
                  supplyValue={supplyValue}
                  borrowValue={borrowValue}
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
                  supplyValue={supplyValue}
                  borrowValue={borrowValue}
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
                  supplyValue={supplyValue}
                  healthFactor={healthFactor}
                  currentCollateral={currentCollateral}
                  currentLoan={currentLoan}
                  ltv={ltv}
                  collateralTokenDecimals={collateralTokenDecimals}
                  loanTokenDecimals={loanTokenDecimals}
                />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  )
} 