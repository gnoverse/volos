package core

import (
	"std"
	"strconv"
	"time"

	u256 "gno.land/p/gnoswap/uint256"
)

// Event names
const (
	// Market events
	CreateMarketEvent       = "CreateMarket"
	SupplyEvent             = "Supply"
	WithdrawEvent           = "Withdraw"
	BorrowEvent             = "Borrow"
	RepayEvent              = "Repay"
	LiquidateEvent          = "Liquidate"
	RegisterIRMEvent        = "RegisterIRM"
	AccrueInterestEvent     = "AccrueInterest"
	SupplyCollateralEvent   = "SupplyCollateral"
	WithdrawCollateralEvent = "WithdrawCollateral"
	FlashLoanEvent          = "FlashLoan"
	SetFeeEvent             = "SetFee"

	// Event names
	EventAccrueInterest     = "accrue_interest"
	EventCreateMarket       = "create_market"
	EventSupply             = "supply"
	EventWithdraw           = "withdraw"
	EventBorrow             = "borrow"
	EventRepay              = "repay"
	EventLiquidate          = "liquidate"
	EventSupplyCollateral   = "supply_collateral"
	EventWithdrawCollateral = "withdraw_collateral"
	AuthorizationSetEvent   = "authorization_set"
)

// Event keys
const (
	// Common keys
	MarketIDKey = "market_id"
	AmountKey   = "amount"
	UserKey     = "user"
	OnBehalfKey = "on_behalf"
	ReceiverKey = "receiver"

	// Market keys
	LoanTokenKey       = "loan_token"
	CollateralTokenKey = "collateral_token"

	// Liquidation keys
	LiquidatorKey    = "liquidator"
	BorrowerKey      = "borrower"
	LiquidatedAmtKey = "liquidated_amount"
	CollateralAmtKey = "collateral_amount"

	// Interest keys
	BorrowRateKey = "borrow_rate"
	InterestKey   = "interest"

	// Event keys
	MarketIdKey     = "market_id"
	SharesKey       = "shares"
	SeizedKey       = "seized"
	FeeKey          = "fee"
	PkgPathKey      = "pkgpath"
	NameKey         = "name"
	AuthorizerKey   = "authorizer"
	AuthorizedKey   = "authorized"
	IsAuthorizedKey = "is_authorized"
	TokenKey        = "token"
	TimestampKey    = "currentTimestamp"
	SupplyAPRKey    = "supplyAPR"
	BorrowAPRKey    = "borrowAPR"
)

// Event emission helper functions
func emitCreateMarket(marketId string, loanToken string, collateralToken string) {
	std.Emit(
		"CreateMarket",
		MarketIDKey, marketId,
		LoanTokenKey, loanToken,
		CollateralTokenKey, collateralToken,
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
	)
}

func emitSupply(marketId string, caller std.Address, onBehalf std.Address, assets, shares *u256.Uint) {
	// Calculate APRs after supply operation
	supplyAPR := CalculateSupplyAPR(marketId)
	borrowAPR := CalculateBorrowAPR(marketId)

	std.Emit(
		"Supply",
		MarketIDKey, marketId,
		UserKey, caller.String(),
		OnBehalfKey, onBehalf.String(),
		AmountKey, assets.ToString(),
		SharesKey, shares.ToString(),
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
		SupplyAPRKey, supplyAPR.ToString(),
		BorrowAPRKey, borrowAPR.ToString(),
	)
}

func emitWithdraw(marketId string, caller std.Address, onBehalf std.Address, receiver std.Address, assets, shares *u256.Uint) {
	// Calculate APRs after withdraw operation
	supplyAPR := CalculateSupplyAPR(marketId)
	borrowAPR := CalculateBorrowAPR(marketId)

	std.Emit(
		"Withdraw",
		MarketIDKey, marketId,
		UserKey, caller.String(),
		OnBehalfKey, onBehalf.String(),
		ReceiverKey, receiver.String(),
		AmountKey, assets.ToString(),
		SharesKey, shares.ToString(),
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
		SupplyAPRKey, supplyAPR.ToString(),
		BorrowAPRKey, borrowAPR.ToString(),
	)
}

func emitBorrow(marketId string, caller std.Address, onBehalf std.Address, receiver std.Address, assets, shares *u256.Uint) {
	// Calculate APRs after borrow operation
	supplyAPR := CalculateSupplyAPR(marketId)
	borrowAPR := CalculateBorrowAPR(marketId)

	std.Emit(
		"Borrow",
		MarketIDKey, marketId,
		UserKey, caller.String(),
		OnBehalfKey, onBehalf.String(),
		ReceiverKey, receiver.String(),
		AmountKey, assets.ToString(),
		SharesKey, shares.ToString(),
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
		SupplyAPRKey, supplyAPR.ToString(),
		BorrowAPRKey, borrowAPR.ToString(),
	)
}

func emitRepay(marketId string, caller std.Address, onBehalf std.Address, assets, shares *u256.Uint) {
	// Calculate APRs after repay operation
	supplyAPR := CalculateSupplyAPR(marketId)
	borrowAPR := CalculateBorrowAPR(marketId)

	std.Emit(
		"Repay",
		MarketIDKey, marketId,
		UserKey, caller.String(),
		OnBehalfKey, onBehalf.String(),
		AmountKey, assets.ToString(),
		SharesKey, shares.ToString(),
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
		SupplyAPRKey, supplyAPR.ToString(),
		BorrowAPRKey, borrowAPR.ToString(),
	)
}

func emitLiquidate(marketId string, caller std.Address, borrower std.Address, repaidAssets, repaidShares, seizedAssets *u256.Uint) {
	// Calculate APRs after liquidation operation
	supplyAPR := CalculateSupplyAPR(marketId)
	borrowAPR := CalculateBorrowAPR(marketId)

	std.Emit(
		"Liquidate",
		MarketIdKey, marketId,
		UserKey, caller.String(),
		BorrowerKey, borrower.String(),
		AmountKey, repaidAssets.ToString(),
		SharesKey, repaidShares.ToString(),
		SeizedKey, seizedAssets.ToString(),
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
		SupplyAPRKey, supplyAPR.ToString(),
		BorrowAPRKey, borrowAPR.ToString(),
	)
}

func emitAccrueInterest(marketId string, borrowRate, interest *u256.Uint) {
	std.Emit(
		"AccrueInterest",
		MarketIDKey, marketId,
		BorrowRateKey, borrowRate.ToString(),
		InterestKey, interest.ToString(),
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
	)
}

func emitRegisterIRM(pkgPath, name string) {
	std.Emit(
		"RegisterIRM",
		PkgPathKey, pkgPath,
		NameKey, name,
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
	)
}

func emitSupplyCollateral(marketId string, caller std.Address, onBehalf std.Address, amount uint64) {
	std.Emit(
		"SupplyCollateral",
		MarketIDKey, marketId,
		UserKey, caller.String(),
		OnBehalfKey, onBehalf.String(),
		AmountKey, u256.NewUint(amount).ToString(),
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
	)
}

func emitWithdrawCollateral(marketId string, caller std.Address, onBehalf std.Address, receiver std.Address, amount uint64) {
	std.Emit(
		"WithdrawCollateral",
		MarketIDKey, marketId,
		UserKey, caller.String(),
		OnBehalfKey, onBehalf.String(),
		ReceiverKey, receiver.String(),
		AmountKey, u256.NewUint(amount).ToString(),
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
	)
}

// emitAuthorizationSet emits an event when authorization is set or revoked
func emitAuthorizationSet(authorizer std.Address, authorized std.Address, isAuthorized bool) {
	std.Emit(
		"AuthorizationSet",
		AuthorizerKey, authorizer.String(),
		AuthorizedKey, authorized.String(),
		IsAuthorizedKey, strconv.FormatBool(isAuthorized),
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
	)
}

// emitFlashLoan emits an event when a flash loan occurs
func emitFlashLoan(caller std.Address, token string, assets int64) {
	std.Emit(
		"FlashLoan",
		UserKey, caller.String(),
		TokenKey, token,
		AmountKey, u256.NewUint(uint64(assets)).ToString(),
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
	)
}

// emitSetFee emits an event when a market fee is set (following Morpho pattern)
func emitSetFee(marketId string, fee string) {
	std.Emit(
		"SetFee",
		MarketIDKey, marketId,
		FeeKey, fee,
		TimestampKey, strconv.FormatInt(time.Now().Unix(), 10),
	)
}
