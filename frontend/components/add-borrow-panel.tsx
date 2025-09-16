"use client"

import { getAllowance, getTokenBalance } from "@/app/services/abci"
import { VOLOS_ADDRESS } from "@/app/services/tx.service"
import { Market } from "@/app/types"
import { formatPrice } from "@/app/utils/format.utils"
import { PositionCard } from "@/components/position-card"
import { SidePanelCard } from "@/components/side-panel-card"
import { useFormValidation } from "@/hooks/use-borrow-validation"
import { useMaxBorrowable } from "@/hooks/use-max-borrowable"
import { useApproveTokenMutation, useBorrowMutation, useSupplyCollateralMutation } from "@/hooks/use-mutations"
import { usePositionCalculations } from "@/hooks/use-position-calculations"
import { useExpectedBorrowAssetsQuery, usePositionQuery } from "@/hooks/use-queries"
import { useUserAddress } from "@/hooks/use-user-address"
import { ArrowDown, Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { formatUnits, parseUnits } from "viem"

interface AddBorrowPanelProps {
  market: Market
}

export function AddBorrowPanel({
  market,
}: AddBorrowPanelProps) {
  const { register, setValue, watch } = useForm({
    defaultValues: {
      supplyAmount: "",
      borrowAmount: "",
      repayAmount: "",
      withdrawAmount: ""
    }
  })

  const { userAddress } = useUserAddress()
  const { data: positionData, refetch: refetchPosition } = usePositionQuery(market.id, userAddress)
  const { data: expectedBorrowAssets } = useExpectedBorrowAssetsQuery(market.id, userAddress)


  const {
    positionMetrics,
    currentCollateral,
    currentBorrowAssets,
    } = usePositionCalculations(positionData ?? {
    borrow_shares: "0",
    supply_shares: "0",
    collateral_supply: "0"
  }, market, expectedBorrowAssets || "")

  const { maxBorrowable, refetch: refetchMaxBorrowable } = useMaxBorrowable(
    positionData ?? {
      borrow_shares: "0",
      supply_shares: "0",
      collateral_supply: "0"
    },
    market,
    userAddress,
    expectedBorrowAssets || "0"
  )

  const {
    isSupplyInputEmpty,
    isSupplyTooManyDecimals,
    supplyButtonMessage,
    isBorrowInputEmpty,
    isBorrowTooManyDecimals,
    isBorrowOverMax,
    borrowButtonMessage
  } = useFormValidation(
    watch("supplyAmount"),
    watch("borrowAmount"),
    market,
    maxBorrowable
  )

  const approveTokenMutation = useApproveTokenMutation()
  const supplyCollateralMutation = useSupplyCollateralMutation()
  const borrowMutation = useBorrowMutation()

  const supplyAmount = watch("supplyAmount")
  const borrowAmount = watch("borrowAmount")

  const isSupplyPending = supplyCollateralMutation.isPending || approveTokenMutation.isPending
  const isBorrowPending = borrowMutation.isPending || approveTokenMutation.isPending

  // Calculate formatted price for USD value display
  // Price decimals: 36 + loan_token_decimals - collateral_token_decimals
  const priceDecimals = 36 + market.loan_token_decimals - market.collateral_token_decimals;
  const formattedPrice = parseFloat(formatPrice(market.current_price, priceDecimals, market.loan_token_decimals));

  const handleMaxBorrow = async () => {
    await Promise.all([
      refetchPosition(),
      refetchMaxBorrowable()
    ])
    
    const maxBorrowableStr = formatUnits(maxBorrowable, market.loan_token_decimals)
    setValue("borrowAmount", maxBorrowableStr)
  }

  const handleSupply = async () => {
    if (isSupplyInputEmpty || isSupplyTooManyDecimals) return;
    
    const supplyAmountInDenom = parseUnits(supplyAmount || "0", market.collateral_token_decimals);
    
    const currentAllowance = BigInt(await getAllowance(market.collateral_token, userAddress!));
    
    if (currentAllowance < supplyAmountInDenom) {
      await approveTokenMutation.mutateAsync({
        tokenPath: market.collateral_token,
        amount: Number(supplyAmountInDenom),
        spenderAddress: VOLOS_ADDRESS
      });
    }
    
    await supplyCollateralMutation.mutateAsync({
      marketId: market.id,
      userAddress: userAddress!,
      amount: Number(supplyAmountInDenom)
    });
    setValue("supplyAmount", "")
  };

  const handleBorrow = async () => {
    if (isBorrowInputEmpty || isBorrowTooManyDecimals || isBorrowOverMax) return;
    
    const borrowAmountInDenom = parseUnits(borrowAmount || "0", market.loan_token_decimals);
    
    const currentAllowance = BigInt(await getAllowance(market.loan_token, userAddress!));
    
    if (currentAllowance < borrowAmountInDenom) {
      await approveTokenMutation.mutateAsync({
        tokenPath: market.loan_token,
        amount: Number(borrowAmountInDenom),
        spenderAddress: VOLOS_ADDRESS
      });
    }
    
    await borrowMutation.mutateAsync({
      marketId: market.id,
      userAddress: userAddress!,
      assets: Number(borrowAmountInDenom)
    });
    setValue("borrowAmount", "")
  };

  return (
    <>
      <form className="space-y-3">
      {/* Borrow Card */}
      <SidePanelCard
        icon={ArrowDown}
        iconColor="text-purple-400"
        title={`Borrow ${market.loan_token_symbol}`}
        register={register}
        fieldName="borrowAmount"  
        buttonMessage={borrowButtonMessage}
        isButtonDisabled={isBorrowInputEmpty || isBorrowTooManyDecimals || isBorrowOverMax || isBorrowPending}
        isButtonPending={isBorrowPending}
        onMaxClickAction={handleMaxBorrow}
        onSubmitAction={handleBorrow}
        inputValue={borrowAmount}
        price={1}
      />
      
      {/* Supply Card */}
      <SidePanelCard
        icon={Plus}
        iconColor="text-blue-400"
        title={`Supply Collateral ${market.collateral_token_symbol}`}
        register={register}
        fieldName="supplyAmount"
        buttonMessage={supplyButtonMessage}
        isButtonDisabled={isSupplyInputEmpty || isSupplyTooManyDecimals || isSupplyPending}
        isButtonPending={isSupplyPending}
        onMaxClickAction={async () => {
          const balance = await getTokenBalance(market.collateral_token, userAddress!);
          const balanceFormatted = formatUnits(BigInt(balance), market.collateral_token_decimals);
          setValue("supplyAmount", balanceFormatted);
        }}
        onSubmitAction={handleSupply}
        inputValue={supplyAmount}
        price={formattedPrice}
      />

      {/* Position Card */}
      <PositionCard 
        market={market}
        supplyAmount={supplyAmount}
        borrowAmount={borrowAmount}
        healthFactor={positionMetrics.healthFactor}
        currentCollateral={formatUnits(currentCollateral, market.collateral_token_decimals)}
        currentBorrowAssets={formatUnits(currentBorrowAssets, market.loan_token_decimals)}
      />
    </form>
    </>
  )
} 
