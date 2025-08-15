import { useGovernanceUserInfo } from "@/app/(app)/governance/queries-mutations"
import { AdenaService } from "@/app/services/adena.service"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Info, WalletIcon } from "lucide-react"
import { useEffect, useState } from "react"

interface GovMemberCardsProps {
  cardStyles: string
}

export function GovMemberCards({ 
  cardStyles 
}: GovMemberCardsProps) {
  const [userAddress, setUserAddress] = useState<string>("")
  const [isConnected, setIsConnected] = useState(false)
  
  // Fetch real governance user info from on-chain
  const { data: userInfo, isLoading, error } = useGovernanceUserInfo(userAddress)

  useEffect(() => {
    const adena = AdenaService.getInstance()
    const address = adena.getAddress()
    const connected = adena.isConnected()
    
    setUserAddress(address)
    setIsConnected(connected)

    const handleAddressChange = (event: CustomEvent) => {
      const newAddress = event.detail?.newAddress || ""
      setUserAddress(newAddress)
      setIsConnected(!!newAddress)
    }
    window.addEventListener("adenaAddressChanged", handleAddressChange as EventListener)

    return () => {
      window.removeEventListener("adenaAddressChanged", handleAddressChange as EventListener)
    }
  }, [])



  const handleWalletConnection = async () => {
    const adenaService = AdenaService.getInstance()
    
    if (isConnected) {
      adenaService.disconnectWallet()
      setIsConnected(false)
      setUserAddress("")
    } else {
      try {
        await adenaService.connectWallet()
        const address = adenaService.getAddress()
        if (address) {
          setUserAddress(address)
        }
        setIsConnected(true)
      } catch (error) {
        console.error("Failed to connect wallet:", error)
      }
    }
  }

  if (!userAddress) {
    return (
      <div className="grid grid-cols-1 gap-6">
        <div className={`${cardStyles} p-6 border-l-4 border-gray-500`}>
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold text-logo-500">User Info</h3>
            <p className="text-gray-500 text-sm mb-4">
              Connect your wallet to view your DAO membership status, voting power, and governance participation details.
            </p>
            <Button 
              variant="ghost" 
              className={cn(
                "bg-gray-800 text-gray-400 rounded-full text-lg hover:bg-gray-800 hover:text-logo-500"
              )}
              onClick={handleWalletConnection}
            >
              <WalletIcon className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-6">
      {/* DAO Membership Card */}
      <div className={`${cardStyles} p-6 border-l-4 border-logo-500`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-logo-500">DAO Membership</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info size={20} className="text-gray-400 hover:text-gray-300 hover:bg-gray-700/60 rounded-full p-1 cursor-default transition-colors" />
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-gray-300 border-none shadow-lg">
                <p className="max-w-xs">
                  You are a member of the DAO if you hold xVLS tokens. To obtain xVLS you need to stake VLS tokens.
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
        ) : error ? (
          <div className="text-red-400 text-sm">
            Error loading DAO membership data
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                userInfo?.isMember 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {userInfo?.isMember ? 'Member' : 'Not a Member'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">xVLS Balance:</span>
              <span className="text-gray-200 font-mono font-semibold">
                {userInfo?.xvlsBalance || 0} xVLS
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Voting Power Card */}
      <div className={`${cardStyles} p-6 border-l-4 border-logo-500`}>
        <h3 className="text-xl font-semibold text-logo-500 mb-4">Voting Power</h3>
        
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-600 rounded w-1/2"></div>
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm">
            Error loading voting power data
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Voting Power:</span>
              <span className="text-logo-500 font-mono font-semibold">
                {userInfo?.xvlsBalance || 0} xVLS
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Can Propose:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                (userInfo?.xvlsBalance || 0) >= (userInfo?.proposalThreshold || 0)
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {(userInfo?.xvlsBalance || 0) >= (userInfo?.proposalThreshold || 0) ? 'Eligible' : 'Not Eligible'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Proposal Threshold:</span>
              <span className="text-gray-200 font-mono">
                {userInfo?.proposalThreshold || 0} xVLS
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
