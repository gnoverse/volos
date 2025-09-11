"use client"

import { Market } from "@/app/types"
import { AddBorrowPanel } from "@/components/add-borrow-panel"
import { RepayWithdrawPanel } from "@/components/repay-withdraw-panel"
import { SupplyPanel } from "@/components/supply-panel"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useUserAddress } from "@/hooks/use-user-address"
import { WalletIcon } from "lucide-react"

interface SidePanelProps {
  tab: string
  setTabAction: (tab: string) => void
  market: Market
}

export function SidePanel({
  tab,
  setTabAction,
  market,
}: SidePanelProps) {
  const { userAddress, isConnected, handleWalletConnection } = useUserAddress()

  if (!userAddress || !isConnected) {
    return (
      <div className="col-span-1 lg:col-span-3 lg:sticky top-0 self-start pr-2">
        <div className="w-full sticky top-0 z-10 backdrop-blur-sm">
          <div className="bg-gray-700/60 border-none rounded-3xl py-8 px-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold text-logo-500">Connect Wallet</h3>
              <p className="text-gray-400 text-sm mb-4">
                Connect your wallet to interact with the market. You&apos;ll be able to supply collateral, borrow assets, and manage your positions.
              </p>
              <Button 
                variant="ghost" 
                className="bg-gray-800 text-gray-400 rounded-full text-lg hover:bg-gray-800 hover:text-logo-500"
                onClick={handleWalletConnection}
              >
                <WalletIcon className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
                      className={`flex-1 py-1 duration-200 ${tab === "add-borrow" ? "shadow-lg text-white font-medium bg-customGray-700/50" : ""}`}
                    >
                      Borrow
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center" sideOffset={8} className="bg-customGray-800/60 text-gray-300 border border-none">
                    <p>Borrow/Supply collateral</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value="repay-withdraw" 
                      className={`flex-1 py-1 duration-200 ${tab === "repay-withdraw" ? "shadow-lg text-white font-medium bg-customGray-700/50" : ""}`}
                    >
                      Repay
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center" sideOffset={8} className="bg-customGray-800/60 text-gray-300 border border-none">
                    <p>Repay/Withdraw collateral</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value="supply-only" 
                      className={`flex-1 py-1 duration-200 ${tab === "supply-only" ? "shadow-lg text-white font-medium bg-customGray-700/50" : ""}`}
                    >
                      Supply
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center" sideOffset={8} className="bg-customGray-800/60 text-gray-300 border border-none">
                    <p>Supply loan token</p>
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
                />
              </TabsContent>
              
               <TabsContent value="repay-withdraw">
                <RepayWithdrawPanel 
                  market={market}
                />
              </TabsContent>
              
             <TabsContent value="supply-only">
                <SupplyPanel 
                  market={market}
                />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  )
} 
