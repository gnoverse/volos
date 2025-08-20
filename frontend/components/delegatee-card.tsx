"use client"

import { useBeginUnstakeVLSMutation } from "@/app/(app)/governance/queries-mutations"
import { formatTokenAmount } from "@/app/utils/format.utils"
import CopiableAddress from "@/components/copiable-addess"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Minus, User } from "lucide-react"
import { useState } from "react"

interface DelegateeCardProps {
  delegatee: string
  amount: number
  userAddress?: string
}

export function DelegateeCard({ delegatee, amount, userAddress }: DelegateeCardProps) {
  const [unstakeAmount, setUnstakeAmount] = useState("")
  const beginUnstakeMutation = useBeginUnstakeVLSMutation()

  const handleUnstake = async () => {
    const wholeTokenAmount = parseFloat(unstakeAmount)
    if (isNaN(wholeTokenAmount) || wholeTokenAmount <= 0) {
      console.error("Invalid unstake amount")
      return
    }

    // Convert whole tokens to denom (multiply by 10^6)
    const amountInDenom = Math.floor(wholeTokenAmount * 1000000)

    if (amountInDenom > amount) {
      console.error(`Insufficient delegation. Requested: ${amountInDenom} denom, Available: ${amount} denom`)
      return
    }

    try {
      await beginUnstakeMutation.mutateAsync({
        amount: amountInDenom,
        delegatee: delegatee
      })
      
      setUnstakeAmount("")
      console.log("Unstaking initiated successfully")
      
      
    } catch (error) {
      console.error("Failed to begin unstake:", error)
    }
  }

  const setMaxUnstakeAmount = () => {
    const maxAmountInTokens = amount / 1000000
    setUnstakeAmount(maxAmountInTokens.toString())
  }

  const isValidUnstakeAmount = () => {
    const unstakeAmountNum = parseFloat(unstakeAmount)
    if (isNaN(unstakeAmountNum) || unstakeAmountNum <= 0) return false
    
    const amountInDenom = Math.floor(unstakeAmountNum * 1000000)
    return amountInDenom <= amount
  }

  return (
    <Card className="bg-gray-800/40 border-gray-700/50 hover:bg-gray-800/60 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-gray-200 font-medium text-base leading-tight flex items-center gap-2">
              <User className="w-4 h-4" />
              Delegatee
            </CardTitle>
            <div className="text-gray-400 text-sm mt-1 font-mono">
              <CopiableAddress value={delegatee} short className="text-gray-400" />
              {userAddress && delegatee === userAddress && (
                <span className="text-logo-500 ml-1">(you)</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Delegated Amount</div>
            <div className="text-logo-500 font-mono font-semibold">
              {formatTokenAmount(amount.toString(), 6, 2, 6)} VLS
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Amount to Unstake
            </label>
            <div className="relative">
              <Input
                type="number"
                placeholder="Enter VLS amount"
                value={unstakeAmount}
                onChange={(e) => setUnstakeAmount(e.target.value)}
                className="bg-gray-800/60 border-gray-600 text-gray-200 placeholder-gray-400 focus:outline-none focus:border-logo-500 focus:ring-1 focus:ring-logo-500 pr-16 pl-3"
                min="0"
                step="0.000001"
                max={amount / 1000000}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={setMaxUnstakeAmount}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
              >
                Max
              </Button>
            </div>
          </div>
          
          <Button
            onClick={handleUnstake}
            disabled={beginUnstakeMutation.isPending || !isValidUnstakeAmount()}
            className="w-full bg-red-600 hover:bg-red-700 text-white border-none disabled:bg-gray-600 disabled:text-gray-400"
          >
            {beginUnstakeMutation.isPending ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Unstaking...
              </>
            ) : (
              <>
                <Minus className="w-4 h-4 mr-2" />
                Begin Unstake
              </>
            )}
          </Button>
          
          <p className="text-xs text-gray-500 text-center">
            Withdrawing staked VLS will be available 7 days after the last proposal you have voted on expires.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
