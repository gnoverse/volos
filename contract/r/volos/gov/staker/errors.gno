package staker

import (
	"errors"
)

var (
	ErrInvalidAmount          = errors.New("[VOLOS-GOV_STAKER-001] amount must be positive")
	ErrInvalidDelegatee       = errors.New("[VOLOS-GOV_STAKER-002] invalid delegatee address")
	ErrInsufficientAllowance  = errors.New("[VOLOS-GOV_STAKER-003] insufficient allowance")
	ErrInsufficientBalance    = errors.New("[VOLOS-GOV_STAKER-004] insufficient balance")
	ErrNoReadyUnstake         = errors.New("[VOLOS-GOV_STAKER-005] no ready unstake")
	ErrInsufficientDelegation = errors.New("[VOLOS-GOV_STAKER-006] insufficient delegation")
)
