package vls

import (
	"errors"
)

var (
	ErrOnlyGovernanceCanExecute = errors.New("[VOLOS-GOV_VLS-001] only governance contract can execute")
	ErrOnlyGovernanceCanUpdate  = errors.New("[VOLOS-GOV_VLS-002] only current governance contract can update governance")
	ErrInsufficientBalance      = errors.New("[VOLOS-GOV_VLS-003] insufficient balance")
	ErrInsufficientAllowance    = errors.New("[VOLOS-GOV_VLS-004] insufficient allowance")
	ErrInvalidAmount            = errors.New("[VOLOS-GOV_VLS-005] invalid amount")
	ErrInvalidAddress           = errors.New("[VOLOS-GOV_VLS-006] invalid address")
	ErrMintOverflow             = errors.New("[VOLOS-GOV_VLS-007] mint overflow")
)
