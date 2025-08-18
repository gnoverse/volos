"use client"

import { useUser, useUserPendingUnstakes } from "@/app/(app)/governance/queries-mutations"
import { useUserAddress } from "@/app/utils/address.utils"
import { DelegateForm } from "@/components/delegate-form"
import { DelegateeCard } from "@/components/delegatee-card"
import { PendingUnstakeCard } from "@/components/pending-unstake-card"

const CARD_STYLES = "bg-gray-700/60 border-none rounded-3xl"

export default function DelegatesPage() {
  const { userAddress, isConnected } = useUserAddress()
  const { data: user } = useUser(userAddress)
  const { data: pendingUnstakes = [] } = useUserPendingUnstakes(userAddress)

  const delegations = user?.staked_vls || {}
  const activeDelegations = Object.entries(delegations).filter(([, amount]) => amount > 0)
  const hasDelegations = activeDelegations.length > 0

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
            />
          ))}
        </div>
      )}

      {/* Pending Unstakes */}
      {isConnected && pendingUnstakes && pendingUnstakes.length > 0 && (
        <div className="mt-8 space-y-4">
          <h4 className="text-lg font-medium text-gray-200 mb-4">Pending Unstakes</h4>
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
