"use client"

import { useUser, useUserPendingUnstakes } from "@/hooks/use-queries"
import { useWithdrawUnstakedVLSMutation } from "@/hooks/use-mutations"
import { useUserAddress } from "@/hooks/use-user-address"
import { DelegateForm } from "@/components/delegate-form"
import { DelegateeCard } from "@/components/delegatee-card"
import { PendingUnstakeCard } from "@/components/pending-unstake-card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl"

export default function DelegatesPage() {
  const { userAddress, isConnected } = useUserAddress()
  const { data: user } = useUser(userAddress)
  const { data: pendingUnstakes = [] } = useUserPendingUnstakes(userAddress)
  const withdrawMutation = useWithdrawUnstakedVLSMutation()

  const handleWithdraw = async () => {
    try {
      await withdrawMutation.mutateAsync()
      // todo add toasts here
    } catch (error) {
      console.error("Failed to withdraw unstaked VLS:", error)
    }
  }

  const delegations = user?.staked_vls || {}
  const activeDelegations = Object.entries(delegations).filter(([, amount]) => amount > 0)
  const hasDelegations = activeDelegations.length > 0
  const hasReadyToWithdraw = (pendingUnstakes || []).some(u => new Date(u.unlock_at).getTime() <= Date.now())

  return (
    <div className={`${CARD_STYLES} p-6 border-l-4 border-logo-500`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-logo-500">Delegate Management</h3>
      </div>

      {/* New Delegation Form */}
      <DelegateForm />

      {/* Current Delegations */}
      {!isConnected ? (
        <div className="text-gray-400 py-6 text-center">
          Connect your wallet to view and manage delegations.
        </div>
      ) : !hasDelegations ? (
        <div className="text-gray-400 py-6 text-center">
          No active delegations found. Delegate VLS tokens to governance members to participate in voting.
        </div>
      ) : (
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-200 mb-4">Your Delegations</h4>
          {activeDelegations.map(([delegatee, amount]) => (
            <DelegateeCard 
              key={delegatee} 
              delegatee={delegatee} 
              amount={amount}
              userAddress={userAddress}
            />
          ))}
        </div>
      )}

      {/* Pending Unstakes */}
      {isConnected && pendingUnstakes && pendingUnstakes.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-200">Pending Unstakes</h4>
            <Button
              onClick={handleWithdraw}
              disabled={!hasReadyToWithdraw || withdrawMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white border-none disabled:bg-gray-600 disabled:text-gray-400"
            >
              {withdrawMutation.isPending ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Withdrawing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Complete Withdrawals
                </>
              )}
            </Button>
          </div>
          {pendingUnstakes.map((pendingUnstake, index) => (
            <PendingUnstakeCard 
              key={`${pendingUnstake.delegatee}_${pendingUnstake.amount}_${index}`} 
              pendingUnstake={pendingUnstake}
            />
          ))}
        </div>
      )}
    </div>
  )
}
