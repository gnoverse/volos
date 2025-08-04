"use client"

import { AdenaService } from "@/app/services/adena.service"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Info, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl"
const queryClient = new QueryClient()

function GovernancePageContent() {
  const [userAddress, setUserAddress] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  // mock data - will be replaced with actual contract calls
  const [daoMembership, setDaoMembership] = useState({
    isMember: false,
    xVLSBalance: "0"
  })
  const [votingPower, setVotingPower] = useState({
    power: "0",
    canPropose: false,
    proposalThreshold: "1000"
  })

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

  useEffect(() => {
    if (userAddress) {
      // simulate API calls
      setTimeout(() => {
        setDaoMembership({
          isMember: true, // mock: user is a member
          xVLSBalance: "1500"
        })
        setVotingPower({
          power: "1500",
          canPropose: true,
          proposalThreshold: "1000"
        })
        setIsLoading(false)
      }, 1000)
    } else {
      setIsLoading(false)
    }
  }, [userAddress])

  const handleRefetch = () => {
    setIsLoading(true)
    // add actual refetch logic here
    setTimeout(() => setIsLoading(false), 500)
  }

  return (
    <div className="items-center justify-center space-y-6 -mt-6 py-6 relative">
      {/* Refetch button  */}
      <Button 
        onClick={handleRefetch}
        className="absolute top-0 right-0 mt-2 mr-2 p-3 bg-gray-700/60 rounded-lg hover:bg-gray-600/80 transition-colors flex items-center gap-2 z-10"
        title="Refetch data"
        variant="outline"
        disabled={isLoading}
      >
        <RefreshCw size={20} className="text-gray-200" />
        <span className="text-sm text-gray-200 font-medium">Refetch Data</span>
      </Button>

      <h1 className="text-[36px] font-bold mb-6 text-gray-300">
        Governance
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 relative">
        {/* Left side - governance information */}
        <div className="col-span-1 lg:col-span-9 space-y-6">
          {/* Governance info cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DAO Membership Card */}
            <div className={`${CARD_STYLES} p-6 border-l-4 border-logo-500`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-logo-500">DAO Membership</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info size={20} className="text-gray-400 hover:text-gray-300 hover:bg-gray-700/60 rounded-full p-1 cursor-default transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-900 text-gray-300 border-none shadow-lg">
                      <p className="max-w-xs">
                        You are a member of the DAO if you hold xVLS tokens. 
                        xVLS tokens represent your governance power and voting rights.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-600 rounded w-1/2"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      daoMembership.isMember 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {daoMembership.isMember ? 'Member' : 'Not a Member'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">xVLS Balance:</span>
                    <span className="text-gray-200 font-mono font-semibold">
                      {daoMembership.xVLSBalance} xVLS
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Voting Power Card */}
            <div className={`${CARD_STYLES} p-6 border-l-4 border-logo-500`}>
              <h3 className="text-xl font-semibold text-logo-500 mb-4">Voting Power</h3>
              
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-600 rounded w-1/2"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Voting Power:</span>
                    <span className="text-logo-500 font-mono font-semibold">
                      {votingPower.power} xVLS
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Can Propose:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      votingPower.canPropose 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {votingPower.canPropose ? 'Eligible' : 'Not Eligible'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Proposal Threshold:</span>
                    <span className="text-gray-200 font-mono">
                      {votingPower.proposalThreshold} xVLS
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Placeholder for future governance features */}
          <div className={`${CARD_STYLES} p-6 border-l-4 border-logo-500`}>
            <h3 className="text-xl font-semibold text-logo-500 mb-4">Active Proposals</h3>
            <div className="text-gray-400 text-center py-8">
              <p>No active proposals at the moment.</p>
              <p className="text-sm mt-2">Check back later for governance proposals.</p>
            </div>
          </div>
        </div>

        {/* Right side - placeholder for future features */}
        <div className="lg:col-span-3">
          <div className={`${CARD_STYLES} p-6 h-full border-l-4 border-logo-500`}>
            <h3 className="text-xl font-semibold text-logo-500 mb-4">Governance Actions</h3>
            <div className="text-gray-400 text-center py-8">
              <p>Governance actions will appear here.</p>
              <p className="text-sm mt-2">Create proposals, vote, and more.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GovernancePage() {
  return (
    <QueryClientProvider client={queryClient}>
      <GovernancePageContent />
    </QueryClientProvider>
  )
}
