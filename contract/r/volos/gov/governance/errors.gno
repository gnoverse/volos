package governance

import "errors"

var (
	ErrInsufficientXVLS     = errors.New("[VOLOS-GOV_GOVERNANCE-001] insufficient xVLS to propose")
	ErrStillHasXVLS         = errors.New("[VOLOS-GOV_GOVERNANCE-002] cannot remove member: address still holds xVLS")
	ErrNoXVLS               = errors.New("[VOLOS-GOV_GOVERNANCE-003] cannot add member: address does not hold any xVLS")
	ErrVotingDeadlineNotMet = errors.New("[VOLOS-GOV_GOVERNANCE-004] voting deadline not met")
	ErrNotStaker            = errors.New("[VOLOS-GOV_GOVERNANCE-005] only staker can call this function")
	ErrVotingPeriodExceedsMaximum = errors.New("[VOLOS-GOV_GOVERNANCE-006] voting period exceeds maximum allowed duration")
)
