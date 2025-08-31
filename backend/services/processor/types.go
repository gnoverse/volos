package processor

//core events

type CreateMarketEvent struct {
	MarketID                string
	LoanToken               string
	CollateralToken         string
	IsToken0Loan            string
	LoanTokenName           string
	LoanTokenSymbol         string
	LoanTokenDecimals       string
	CollateralTokenName     string
	CollateralTokenSymbol   string
	CollateralTokenDecimals string
	Timestamp               string
	LLTV                    string
}

type SupplyEvent struct {
	MarketID  string
	User      string
	OnBehalf  string
	Amount    string
	Shares    string
	Timestamp string
	SupplyAPR string
	BorrowAPR string
}

type WithdrawEvent struct {
	MarketID  string
	User      string
	OnBehalf  string
	Receiver  string
	Amount    string
	Shares    string
	Timestamp string
	SupplyAPR string
	BorrowAPR string
}

type BorrowEvent struct {
	MarketID  string
	User      string
	OnBehalf  string
	Receiver  string
	Amount    string
	Shares    string
	Timestamp string
	SupplyAPR string
	BorrowAPR string
}

type RepayEvent struct {
	MarketID  string
	User      string
	OnBehalf  string
	Amount    string
	Shares    string
	Timestamp string
	SupplyAPR string
	BorrowAPR string
}

type LiquidateEvent struct {
	MarketID  string
	User      string
	Borrower  string
	Amount    string
	Shares    string
	Seized    string
	Timestamp string
	SupplyAPR string
	BorrowAPR string
}

type SupplyCollateralEvent struct {
	MarketID  string
	User      string
	OnBehalf  string
	Amount    string
	Timestamp string
}

type WithdrawCollateralEvent struct {
	MarketID  string
	User      string
	OnBehalf  string
	Receiver  string
	Amount    string
	Timestamp string
}

// governance events

type ProposalCreatedEvent struct {
	ProposalID string
	Title      string
	Body       string
	Proposer   string
	Deadline   string
	Quorum     string
	Timestamp  string
}

type ProposalExecutedEvent struct {
	ProposalID string
	Status     string
}

type VoteCastEvent struct {
	ProposalID string
	Voter      string
	Vote       string
	Reason     string
	XVLSAmount int64
	Timestamp  string
}

type MemberEvent struct {
	Member string
}

type StakeEvent struct {
	Staker         string
	Delegatee      string
	Amount         int64
	CooldownPeriod int64
	Timestamp      string
}

type BeginUnstakeEvent struct {
	Staker    string
	Delegatee string
	Amount    int64
	UnlockAt  int64
	Timestamp string
	UnstakeID string
}

type GovernanceWithdrawEvent struct {
	Staker       string
	WithdrawnIDs []string
}
