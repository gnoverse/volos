package core

import (
	"errors"
)

var (
	// Market errors
	ErrMarketNotCreated      = errors.New("[VOLOS-CORE-001] market not created")
	ErrMarketAlreadyCreated  = errors.New("[VOLOS-CORE-002] created")
	ErrTokenPairNotInGnoswap = errors.New("[VOLOS-CORE-003] token pair not in gnoswap pools")
	ErrZeroAddress           = errors.New("[VOLOS-CORE-004] zero address")
	ErrInvalidAddress        = errors.New("[VOLOS-CORE-005] invalid address")
	ErrSameToken             = errors.New("[VOLOS-CORE-006] loan and collateral tokens cannot be the same")
	ErrIRMNotEnabled         = errors.New("[VOLOS-CORE-007] IRM not enabled")
	ErrIRMAlreadyRegistered  = errors.New("[VOLOS-CORE-008] IRM already registered")
	ErrIRMNotRegistered      = errors.New("[VOLOS-CORE-009] IRM not registered")
	ErrLLTVNotEnabled        = errors.New("[VOLOS-CORE-010] LLTV not enabled")
	ErrMaxFeeExceeded        = errors.New("[VOLOS-CORE-011] max fee exceeded")
	ErrNotOwner              = errors.New("[VOLOS-CORE-012] not owner")
	ErrAlreadySet            = errors.New("[VOLOS-CORE-013] already set")

	// Supply/Withdraw errors
	ErrInconsistentAmount    = errors.New("[VOLOS-CORE-014] must specify either assets or shares, not both")
	ErrInsufficientBalance   = errors.New("[VOLOS-CORE-015] insufficient token balance")
	ErrInsufficientShares    = errors.New("[VOLOS-CORE-016] insufficient shares")
	ErrInsufficientLiquidity = errors.New("[VOLOS-CORE-017] insufficient liquidity in market")
	ErrDivisionByZero        = errors.New("[VOLOS-CORE-018] division by zero")

	// Borrow errors
	ErrInsufficientCollateral = errors.New("[VOLOS-CORE-019] insufficient collateral for borrow")
	ErrExceedsLTV             = errors.New("[VOLOS-CORE-020] borrow would exceed maximum LTV")
	ErrZeroBorrow             = errors.New("[VOLOS-CORE-021] borrow amount must be greater than zero")
	ErrNoCollateral           = errors.New("[VOLOS-CORE-022] must deposit collateral before borrowing")

	// Liquidation errors
	ErrHealthyPosition = errors.New("[VOLOS-CORE-023] healthy position")

	// Oracle errors
	ErrPriceNotAvailable = errors.New("[VOLOS-CORE-024] price not available from pool")

	// Transfer errors
	ErrInsufficientAllowance     = errors.New("[VOLOS-CORE-025] insufficient allowance")
	ErrTransferFailed            = errors.New("[VOLOS-CORE-026] transfer failed")
	ErrBalanceVerificationFailed = errors.New("[VOLOS-CORE-027] balance verification failed")

	// Flash loan errors
	ErrZeroAssets = errors.New("[VOLOS-CORE-028] zero assets")

	// Authorization errors
	ErrUnauthorized = errors.New("[VOLOS-CORE-029] unauthorized")
)
