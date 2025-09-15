"use client"

import { getAllowance, getTokenBalance } from "@/app/services/abci"
import { VOLOS_ADDRESS } from "@/app/services/tx.service"
import { Market } from "@/app/types"
import { calculateMaxWithdrawable } from "@/app/utils/position.utils"
import { SidePanelCard } from "@/components/side-panel-card"
import { TransactionSuccessDialog } from "@/components/transaction-success-dialog"
import { useApproveTokenMutation, useSupplyMutation, useWithdrawMutation } from "@/hooks/use-mutations"
import { usePositionQuery } from "@/hooks/use-queries"
import { useSupplyWithdrawValidation } from "@/hooks/use-supply-withdraw-validation"
import { useUserAddress } from "@/hooks/use-user-address"
import { ArrowDown, Plus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { formatUnits, parseUnits } from "viem"

interface SupplyPanelProps {
  market: Market
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
  const { data: positionData } = usePositionQuery(market.id, userAddress)
  
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successDialogData, setSuccessDialogData] = useState<{
    title: string
    txHash?: string
  }>({ title: "", txHash: "" })
  
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
    
    const supplyAmountInDenom = parseUnits(supplyAmount || "0", market.loan_token_decimals);
    
    const currentAllowance = BigInt(await getAllowance(market.loan_token, userAddress!));
    
    if (currentAllowance < supplyAmountInDenom) {
      await approveTokenMutation.mutateAsync({
        tokenPath: market.loan_token,
        amount: Number(supplyAmountInDenom),
        spenderAddress: VOLOS_ADDRESS
      });
    }
    
    const response = await supplyMutation.mutateAsync({
      marketId: market.id,
      userAddress: userAddress!,
      assets: Number(supplyAmountInDenom)
    });
    
    if (response.status === 'success') {
      setSuccessDialogData({
        title: "Supply Successful",
        txHash: (response as { txHash?: string; hash?: string }).txHash || (response as { txHash?: string; hash?: string }).hash
      });
      setShowSuccessDialog(true);
      reset();
    }   
  };

  const handleWithdraw = async () => {
    if (isWithdrawInputEmpty || isWithdrawTooManyDecimals || isWithdrawOverMax) return;
    
    const withdrawAmountInDenom = parseUnits(withdrawAmount || "0", market.loan_token_decimals);
    
    const currentAllowance = BigInt(await getAllowance(market.loan_token, userAddress!));
    
    if (currentAllowance < withdrawAmountInDenom) {
      await approveTokenMutation.mutateAsync({
        tokenPath: market.loan_token,
        amount: Number(withdrawAmountInDenom),
        spenderAddress: VOLOS_ADDRESS
      });
    }
    
    const response = await withdrawMutation.mutateAsync({
      marketId: market.id,
      userAddress: userAddress!,
      assets: Number(withdrawAmountInDenom)
    });
    
    if (response.status === 'success') {
      setSuccessDialogData({
        title: "Withdraw Successful",
        txHash: (response as { txHash?: string; hash?: string }).txHash || (response as { txHash?: string; hash?: string }).hash
      });
      setShowSuccessDialog(true);
      reset();
    }
  };
    
    return (
    <>
        <form className="space-y-3">
      {/* Supply Card */}
      <SidePanelCard
        icon={Plus}
        iconColor="text-blue-400"
        title={`Supply ${market.loan_token_symbol}`}
        register={register}
        fieldName="supplyAmount"
        buttonMessage={supplyButtonMessage}
        isButtonDisabled={isSupplyInputEmpty || isSupplyTooManyDecimals || isSupplyPending}
        isButtonPending={isSupplyPending}
        onMaxClickAction={async () => {
          const balance = await getTokenBalance(market.loan_token, userAddress!);
          const balanceFormatted = formatUnits(BigInt(balance), market.loan_token_decimals);
          setValue("supplyAmount", balanceFormatted);
        }}
        onSubmitAction={handleSupply}
        inputValue={supplyAmount}
        price={1}
      />

      {/* Withdraw Card */}
      <SidePanelCard
        icon={ArrowDown}
        iconColor="text-purple-400"
        title={`Withdraw ${market.loan_token_symbol}`}
        register={register}
        fieldName="withdrawAmount"
        buttonMessage={withdrawButtonMessage}
        isButtonDisabled={isWithdrawInputEmpty || isWithdrawTooManyDecimals || isWithdrawOverMax || isWithdrawPending}
        isButtonPending={isWithdrawPending}
        onMaxClickAction={() => {
          setValue("withdrawAmount", formatUnits(maxWithdrawable, market.loan_token_decimals));
        }}
        onSubmitAction={handleWithdraw}
        inputValue={withdrawAmount}
        price={1}
      />
        </form>

    {/* Success Dialog */}
    <TransactionSuccessDialog
      isOpen={showSuccessDialog}
      onClose={() => setShowSuccessDialog(false)}
      title={successDialogData.title}
      txHash={successDialogData.txHash}
    />
    </>
    )
} 
