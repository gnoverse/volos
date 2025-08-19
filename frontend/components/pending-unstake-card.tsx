"use client"

import { useWithdrawUnstakedVLSMutation } from "@/app/(app)/governance/queries-mutations"
import { PendingUnstake } from "@/app/services/api.service"
import { formatTimestamp, formatTokenAmount } from "@/app/utils/format.utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Download } from "lucide-react"

interface PendingUnstakeCardProps {
  pendingUnstake: PendingUnstake
}

export function PendingUnstakeCard({ pendingUnstake }: PendingUnstakeCardProps) {
  const unlockDate = new Date(pendingUnstake.unlock_at)
  const isUnlocked = unlockDate.getTime() <= Date.now()
  const withdrawMutation = useWithdrawUnstakedVLSMutation()

  const handleWithdraw = async () => {
    try {
      await withdrawMutation.mutateAsync()
    } catch (error) {
      console.error("Failed to withdraw unstaked VLS:", error)
    }
  }

  return (
    <Card className={`bg-gray-800/40 border-gray-700/50 transition-colors ${
      isUnlocked ? 'border-green-500/30 bg-green-500/5' : 'border-yellow-500/30 bg-yellow-500/5'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-gray-200 font-medium text-base leading-tight flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Unstake
            </CardTitle>
            <div className="text-gray-400 text-sm mt-1 font-mono">
              {pendingUnstake.delegatee.slice(0, 12)}...{pendingUnstake.delegatee.slice(-8)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Amount</div>
            <div className="text-logo-500 font-mono font-semibold">
              {formatTokenAmount(pendingUnstake.amount.toString(), 6, 2, 6)} VLS
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Status:</span>
            <span className={`text-sm font-medium ${
              isUnlocked ? 'text-green-400' : 'text-yellow-400'
            }`}>
              {isUnlocked ? 'Ready to Complete' : 'Incomplete'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Unlocks at:</span>
            <span className="text-sm text-gray-300">
              {formatTimestamp(unlockDate.getTime())}
            </span>
          </div>
          
          {isUnlocked && (
            <div className="space-y-3">
              <div className="p-2 bg-green-500/10 border border-green-500/30 rounded text-sm text-green-400">
                This unstake is ready to be completed. You can now withdraw your VLS tokens.
              </div>
              
              <Button
                onClick={handleWithdraw}
                disabled={withdrawMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 text-white border-none disabled:bg-gray-600 disabled:text-gray-400"
              >
                {withdrawMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Withdrawing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Withdraw VLS
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
