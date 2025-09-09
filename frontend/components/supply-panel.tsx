"use client"

import { useApproveTokenMutation, usePositionQuery, useSupplyMutation, useWithdrawMutation } from "@/app/(app)/borrow/queries-mutations"
import { MarketInfo } from "@/app/types"
import { calculateMaxWithdrawable } from "@/app/utils/position.utils"
import { SidePanelCard } from "@/components/side-panel-card"
import { useSupplyWithdrawValidation } from "@/hooks/use-supply-withdraw-validation"
import { useUserAddress } from "@/hooks/use-user-address"
import { ArrowDown, Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { formatUnits } from "viem"

interface SupplyPanelProps {
  market: MarketInfo
}

export function SupplyPanel({
  market,
}: SupplyPanelProps) {
  const { register, setValue, watch, reset } = useForm({
        defaultValues: {
            supplyAmount: "",
      withdrawAmount: ""
    }
  })

  const { userAddress } = useUserAddress()
  const { data: positionData } = usePositionQuery(market.poolPath!, userAddress)
  
  const maxWithdrawable = calculateMaxWithdrawable(positionData ?? {
    borrow_shares: "0",
    supply_shares: "0",
    collateral_supply: "0"
  }, market)
  
  const approveTokenMutation = useApproveTokenMutation()
  const supplyMutation = useSupplyMutation()
  const withdrawMutation = useWithdrawMutation()
    
  const supplyAmount = watch("supplyAmount");
  const withdrawAmount = watch("withdrawAmount");

  const {
    isSupplyInputEmpty,
    isSupplyTooManyDecimals,
    supplyButtonMessage,
    isWithdrawInputEmpty,
    isWithdrawTooManyDecimals,
    isWithdrawOverMax,
    withdrawButtonMessage,
  } = useSupplyWithdrawValidation(
    supplyAmount,
    withdrawAmount,
    market,
    maxWithdrawable
  );

  const isSupplyPending = supplyMutation.isPending || approveTokenMutation.isPending;
  const isWithdrawPending = withdrawMutation.isPending || approveTokenMutation.isPending;
    
    const handleSupply = async () => {
    if (isSupplyInputEmpty || isSupplyTooManyDecimals) return;
    
    const supplyAmountInTokens = Number(supplyAmount || "0");
    
    try {
      await approveTokenMutation.mutateAsync({
        tokenPath: market.loanToken!,
        amount: supplyAmountInTokens * Math.pow(10, market.loanTokenDecimals)
      });
      
      await supplyMutation.mutateAsync({
        marketId: market.poolPath!,
        userAddress: userAddress!,
        assets: supplyAmountInTokens * Math.pow(10, market.loanTokenDecimals)
      });
      
      reset();
    } catch (error) {
      console.error("Supply transaction failed:", error);
    }
  };

  const handleWithdraw = async () => {
    if (isWithdrawInputEmpty || isWithdrawTooManyDecimals || isWithdrawOverMax) return;
    
    const withdrawAmountInTokens = Number(withdrawAmount || "0");
    
    try {
      await approveTokenMutation.mutateAsync({
        tokenPath: market.loanToken!,
        amount: withdrawAmountInTokens * Math.pow(10, market.loanTokenDecimals)
      });
      
      await withdrawMutation.mutateAsync({
        marketId: market.poolPath!,
        userAddress: userAddress!,
        assets: withdrawAmountInTokens * Math.pow(10, market.loanTokenDecimals)
      });
      
      reset();
    } catch (error) {
      console.error("Withdraw transaction failed:", error);
    }
  };
    
    return (
        <form className="space-y-3">
          {/* Supply Card */}
      <SidePanelCard
        icon={Plus}
        iconColor="text-blue-400"
        title={`Supply ${market.loanTokenSymbol}`}
        register={register}
        fieldName="supplyAmount"
        tokenSymbol={market.loanTokenSymbol}
        currentBalanceFormatted="0.00"
        buttonMessage={supplyButtonMessage}
        isButtonDisabled={isSupplyInputEmpty || isSupplyTooManyDecimals || isSupplyPending}
        isButtonPending={isSupplyPending}
        onMaxClickAction={() => {
          // TODO: use ABCI
          setValue("supplyAmount", "0");
        }}
        onSubmitAction={handleSupply}
        inputValue={supplyAmount}
      />

      {/* Withdraw Card */}
      <SidePanelCard
        icon={ArrowDown}
        iconColor="text-purple-400"
        title={`Withdraw ${market.loanTokenSymbol}`}
        register={register}
        fieldName="withdrawAmount"
        tokenSymbol={market.loanTokenSymbol}
        currentBalanceFormatted={formatUnits(maxWithdrawable, market.loanTokenDecimals)}
        buttonMessage={withdrawButtonMessage}
        isButtonDisabled={isWithdrawInputEmpty || isWithdrawTooManyDecimals || isWithdrawOverMax || isWithdrawPending}
        isButtonPending={isWithdrawPending}
        onMaxClickAction={() => {
          setValue("withdrawAmount", formatUnits(maxWithdrawable, market.loanTokenDecimals));
        }}
        onSubmitAction={handleWithdraw}
        inputValue={withdrawAmount}
      />
        </form>
    )
} 
