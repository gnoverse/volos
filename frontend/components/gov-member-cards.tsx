import { getAllowance } from "@/app/services/abci"
import { STAKER_ADDRESS, VLS_PKG_PATH } from "@/app/services/tx.service"
import { formatTokenAmount } from "@/app/utils/format.utils"
import { TransactionSuccessDialog } from "@/components/transaction-success-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useApproveTokenMutation, useStakeVLSMutation } from "@/hooks/use-mutations"
import { useGovernanceUserInfo } from "@/hooks/use-queries"
import { useUserAddress } from "@/hooks/use-user-address"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, Info, Plus, WalletIcon } from "lucide-react"
import { useState } from "react"
import { formatUnits } from "viem"

interface GovMemberCardsProps {
  cardStyles: string
}

export function GovMemberCards({ 
  cardStyles 
}: GovMemberCardsProps) {
  const { userAddress, isConnected, handleWalletConnection } = useUserAddress()
  const [isStaking, setIsStaking] = useState(false)
  const [isStakeExpanded, setIsStakeExpanded] = useState(false)
  const [stakeAmount, setStakeAmount] = useState("")
  
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successDialogData, setSuccessDialogData] = useState<{
    title: string
    txHash?: string
  }>({ title: "", txHash: "" })
  
  const { data: userInfo, isLoading, error, refetch: refetchUserInfo } = useGovernanceUserInfo(userAddress)
  const approveVLSMutation = useApproveTokenMutation()
  const stakeVLSMutation = useStakeVLSMutation()

  const handleStakeVLS = async () => {
    const wholeTokenAmount = parseFloat(stakeAmount)
    if (isNaN(wholeTokenAmount) || wholeTokenAmount <= 0) {
      console.error("Invalid stake amount")
      return
    }

    // Convert whole tokens to denom (multiply by 10^6)
    const amountInDenom = Math.floor(wholeTokenAmount * 1000000)
    const currentVlsBalance = userInfo?.vlsBalance || 0

    if (amountInDenom > currentVlsBalance) {
      return
    }

    setIsStaking(true)
    const currentAllowance = BigInt(await getAllowance(VLS_PKG_PATH, userAddress!))
    
    if (currentAllowance < BigInt(amountInDenom)) {
      await approveVLSMutation.mutateAsync({
        tokenPath: VLS_PKG_PATH,
        spenderAddress: STAKER_ADDRESS,
        amount: amountInDenom
      })
    }

    const response = await stakeVLSMutation.mutateAsync({
      amount: amountInDenom,
      delegatee: userAddress
    })
    
    if (response.status === 'success') {
      setSuccessDialogData({
        title: "Stake VLS Successful",
        txHash: (response as { txHash?: string; hash?: string }).txHash || (response as { txHash?: string; hash?: string }).hash
      });
      setShowSuccessDialog(true);
    }
    
    await refetchUserInfo()
    
    setStakeAmount("")
    setIsStakeExpanded(false)
          
    setIsStaking(false)
  }

  const toggleStakeSection = () => {
    setIsStakeExpanded(!isStakeExpanded)
    if (!isStakeExpanded) {
      setStakeAmount("")
    }
  }

  const handleMaxAmount = () => {
    if (userInfo?.vlsBalance) {
      const maxAmount = formatUnits(BigInt(userInfo.vlsBalance), 6)
      setStakeAmount(maxAmount.toString())
    }
  }

  const isValidAmount = () => {
    const amount = parseFloat(stakeAmount)
    if (isNaN(amount) || amount <= 0) return false
    
    const amountInDenom = Math.floor(amount * 1000000)
    return amountInDenom <= (userInfo?.vlsBalance || 0)
  }

  if (!userAddress) {
    return (
      <div className="grid grid-cols-1 gap-6">
        <div className={`${cardStyles} p-6 border-l-4 border-gray-500`}>
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold text-logo-500">User Info</h3>
            <p className="text-gray-500 text-sm mb-4">
              Connect your wallet to view your governance membership status, voting power, and governance participation details.
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
      {/* Governance Membership Card */}
      <div className={`${cardStyles} p-6 border-l-4 border-logo-500`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-logo-500">Governance Membership</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info size={20} className="text-gray-400 hover:text-gray-300 hover:bg-gray-700/60 rounded-full p-1 cursor-default transition-colors" />
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-gray-300 border-none shadow-lg">
                <p className="max-w-xs">
                  You are a member of the governance if you hold xVLS tokens. To obtain xVLS you need to stake VLS tokens.
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
            Error loading Governance membership data
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
              <span className="text-gray-400">VLS Balance:</span>
              <span className="text-gray-200 font-mono font-semibold">
                {formatTokenAmount((userInfo?.vlsBalance || 0).toString(), 6, 2, 6)} VLS
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">xVLS Balance:</span>
              <span className="text-gray-200 font-mono font-semibold">
                {formatTokenAmount((userInfo?.xvlsBalance || 0).toString(), 6, 2, 6)} xVLS
              </span>
            </div>
            
            {/* Collapsible Stake VLS Section */}
            <div className="mt-4 pt-3 border-t border-gray-600/30">
              {/* Toggle Button */}
              <Button
                onClick={toggleStakeSection}
                variant="ghost"
                className="w-full justify-between p-3 h-auto bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  <span>Stake VLS Tokens</span>
                </div>
                {isStakeExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>

              {/* Collapsible Content */}
              {isStakeExpanded && (
                <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-2">
                    <label htmlFor="stakeAmount" className="text-sm text-gray-400">
                      Amount to stake
                    </label>
                    <div className="relative">
                      <Input
                        id="stakeAmount"
                        type="number"
                        placeholder="Enter VLS amount"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-logo-500 pr-16"
                        min="0"
                        step="0.000001"
                        max={parseFloat(formatTokenAmount((userInfo?.vlsBalance || 0).toString(), 6, 2, 6).replace(/,/g, ''))}
                        allowNegative={false}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleMaxAmount}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                      >
                        Max
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Available balance: {formatTokenAmount((userInfo?.vlsBalance || 0).toString(), 6, 2, 6)} VLS
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleStakeVLS}
                    disabled={isStaking || !isConnected || !isValidAmount()}
                    className={cn(
                      "w-full rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                      isValidAmount() 
                        ? "bg-logo-600 hover:bg-logo-700 text-white" 
                        : "bg-gray-600 text-gray-400"
                    )}
                  >
                    {isStaking ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        {approveVLSMutation.isPending ? "Approving..." : stakeVLSMutation.isPending ? "Staking..." : "Processing..."}
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Stake VLS
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-gray-500 text-center">
                    Stake VLS tokens to mint xVLS and gain voting power. xVLS is non-transferable. Withdrawing staked VLS will be available 7 days after the last proposal you have voted on expires.
                  </p>
                </div>
              )}
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
                {userInfo?.xvlsBalance || 0} <span className="text-xs text-gray-500">(xVLS denom)</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Proposal Threshold:</span>
              <span className="text-gray-200 font-mono">
                {userInfo?.proposalThreshold || 0} <span className="text-xs text-gray-500">(xVLS denom)</span>
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
          </div>
        )}
      </div>

      {/* Success Dialog */}
      <TransactionSuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        title={successDialogData.title}
        txHash={successDialogData.txHash}
      />
    </div>
  )
} 
