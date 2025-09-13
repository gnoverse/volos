"use client"

import { useApproveVLSMutation, useStakeVLSMutation } from "@/app/(app)/governance/queries-mutations"
import { STAKER_PKG_PATH } from "@/app/services/tx.service"
import { TransactionSuccessDialog } from "@/components/transaction-success-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUserAddress } from "@/hooks/use-user-address"
import { ChevronDown, ChevronUp, Plus } from "lucide-react"
import { useState } from "react"

export function DelegateForm() {
  const { isConnected } = useUserAddress()
  const [newDelegatee, setNewDelegatee] = useState("")
  const [delegateAmount, setDelegateAmount] = useState("")
  const [isDelegating, setIsDelegating] = useState(false)
  const [isDelegateExpanded, setIsDelegateExpanded] = useState(false)
  
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successDialogData, setSuccessDialogData] = useState<{
    title: string
    txHash?: string
  }>({ title: "", txHash: "" })
  
  const approveVLSMutation = useApproveVLSMutation()
  const stakeVLSMutation = useStakeVLSMutation()

  const toggleDelegateSection = () => {
    setIsDelegateExpanded(!isDelegateExpanded)
    if (!isDelegateExpanded) {
      setNewDelegatee("")
      setDelegateAmount("")
    }
  }

  const handleDelegate = async () => {
    if (!isConnected || !newDelegatee || !delegateAmount) {
      console.error("Missing required fields for delegation")
      return
    }

    const wholeTokenAmount = parseFloat(delegateAmount)
    if (isNaN(wholeTokenAmount) || wholeTokenAmount <= 0) {
      console.error("Invalid delegation amount")
      return
    }

    // Convert whole tokens to denom (multiply by 10^6) VLS has 6 decimals
    const amountInDenom = Math.floor(wholeTokenAmount * 1000000)

    setIsDelegating(true)
    try {
      await approveVLSMutation.mutateAsync({
        spender: STAKER_PKG_PATH,
        amount: amountInDenom
      })

      const response = await stakeVLSMutation.mutateAsync({
        amount: amountInDenom,
        delegatee: newDelegatee
      })
      
      if (response.status === 'success') {
        setSuccessDialogData({
          title: "Delegate VLS Successful",
          txHash: (response as { txHash?: string; hash?: string }).txHash || (response as { txHash?: string; hash?: string }).hash
        });
        setShowSuccessDialog(true);
      }
      
      setNewDelegatee("")
      setDelegateAmount("")
      setIsDelegateExpanded(false)
      
    } catch (error) {
      console.error("Failed to delegate VLS:", error)
    } finally {
      setIsDelegating(false)
    }
  }

  return (
    <div className="mb-6 p-4 bg-gray-800/40 rounded-lg border border-gray-700/50">
      {/* Toggle Button */}
      <Button
        onClick={toggleDelegateSection}
        variant="ghost"
        className="w-full justify-between p-3 h-auto bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-lg transition-colors"
      >
        <div className="flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          <span>Delegate to New Address</span>
        </div>
        {isDelegateExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </Button>

      {/* Collapsible Content */}
      {isDelegateExpanded && (
        <div className="mt-3 space-y-3 duration-200">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Delegatee Address
            </label>
            <Input
              type="text"
              placeholder="Enter governance member address (g1...)"
              value={newDelegatee}
              onChange={(e) => setNewDelegatee(e.target.value)}
              className="bg-gray-800/60 text-gray-200 placeholder-gray-400 border-gray-600"
              id="delegateeAddress"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Amount to Delegate
            </label>
            <Input
              type="number"
              placeholder="Enter VLS amount"
              value={delegateAmount}
              onChange={(e) => setDelegateAmount(e.target.value)}
              className="bg-gray-800/60 text-gray-200 placeholder-gray-400 border-gray-600"
              id="delegateAmount"
              min="0"
              step="0.000001"
            />
          </div>
          
          <Button
            onClick={handleDelegate}
            disabled={isDelegating || !isConnected || !newDelegatee || !delegateAmount}
            className="w-full bg-logo-600 hover:bg-logo-700 text-white border-none disabled:bg-gray-600 disabled:text-gray-400"
          >
            {isDelegating ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {approveVLSMutation.isPending ? "Approving..." : stakeVLSMutation.isPending ? "Delegating..." : "Processing..."}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Delegate VLS
              </>
            )}
          </Button>
        </div>
      )}

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
