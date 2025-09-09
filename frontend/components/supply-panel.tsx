"use client"

import { usePositionQuery, useSupplyWithApproval, useWithdrawWithApproval } from "@/app/(app)/borrow/queries-mutations"
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
  
  const supplyWithApprovalMutation = useSupplyWithApproval()
  const withdrawWithApprovalMutation = useWithdrawWithApproval()
    
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

  const isSupplyPending = supplyWithApprovalMutation.isPending;
  const isWithdrawPending = withdrawWithApprovalMutation.isPending;
    
    const handleSupply = async () => {
    if (isSupplyInputEmpty || isSupplyTooManyDecimals) return;
    
    const supplyAmountInTokens = Number(supplyAmount || "0");
    
    supplyWithApprovalMutation.mutate({
      marketId: market.poolPath!,
      loanTokenPath: market.loanToken!,
      amount: supplyAmountInTokens,
      loanTokenDecimals: market.loanTokenDecimals
    }, {
      onSuccess: () => {
        reset();
      }
    });
  };

  const handleWithdraw = async () => {
    if (isWithdrawInputEmpty || isWithdrawTooManyDecimals || isWithdrawOverMax) return;
    
    const withdrawAmountInTokens = Number(withdrawAmount || "0");
    
    withdrawWithApprovalMutation.mutate({
          marketId: market.poolPath!,
      loanTokenPath: market.loanToken!,
      amount: withdrawAmountInTokens,
      loanTokenDecimals: market.loanTokenDecimals
        }, {
          onSuccess: () => {
            reset();
          }
        });
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
          // For supply, we don't have a max amount since user can supply any amount
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
