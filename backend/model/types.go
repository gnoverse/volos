package model

import "time"

const CorePkgPath = "gno.land/r/volos/core"                 // the package path of the Volos core contract
const GovernancePkgPath = "gno.land/r/volos/gov/governance" // the package path of the Volos governance contract
const StakerPkgPath = "gno.land/r/volos/gov/staker"         // the package path of the Volos staker contract
const VlsPkgPath = "gno.land/r/volos/gov/vls"               // the package path of the Volos vls contract
const XvlsPkgPath = "gno.land/r/volos/gov/xvls"             // the package path of the Volos xvls contract
const Rpc = "http://localhost:26657"                        // the RPC endpoint of the node
const BlockHeightOnDeploy = 0                               // the block height of the deployment of the Volos contract

// Data is a type to be used to extract the value and timestamp from a data point.
// Since transactions only have block height, we need to fetch the timestamp from the block height.
// This is the format of the data (mostly for charts) that is cached in Firestore and that is sent to the frontend.
type Data struct {
	Value     float64 `json:"value"`
	Timestamp string  `json:"timestamp"`
}

// TransactionData is a type to be used to extract the value and block height from a transaction.
type TransactionData struct {
	Value       float64
	BlockHeight int64
}

// MarketActivity is a type to be used to extract the type, amount, caller, hash, timestamp, and isAmountInShares from a market activity transaction.
// This is the format of the data that is cached in Firestore and that is sent to the frontend.
type MarketActivity struct {
	Type             string  `json:"type"`
	Amount           float64 `json:"amount"`
	Caller           string  `json:"caller"`
	Hash             string  `json:"hash"`
	Timestamp        string  `json:"timestamp"`
	IsAmountInShares bool    `json:"isAmountInShares"`
}

// Proposal represents the complete structure of a governance proposal document stored in Firestore.
// This struct contains all fields that are persisted to the database when a proposal is created,
// including metadata and timestamps for tracking proposal lifecycle.
// Vote totals can be maintained transactionally on write and/or calculated on-demand from the votes subcollection.
type Proposal struct {
	ID        string    `firestore:"id" json:"id"`                 // Unique proposal identifier from the governance contract
	Title     string    `firestore:"title" json:"title"`           // Human-readable title of the proposal
	Body      string    `firestore:"body" json:"body"`             // Detailed description and content of the proposal
	Proposer  string    `firestore:"proposer" json:"proposer"`     // Address of the user who created the proposal
	Deadline  time.Time `firestore:"deadline" json:"deadline"`     // Unix timestamp when voting period ends
	Status    string    `firestore:"status" json:"status"`         // Current status: "active", "passed", "failed"
	CreatedAt time.Time `firestore:"created_at" json:"created_at"` // Timestamp when proposal was created in database
	LastVote  time.Time `firestore:"last_vote" json:"last_vote"`   // Timestamp of the last vote cast on this proposal
	Quorum    int64     `firestore:"quorum" json:"quorum"`         // Quorum for the proposal

	// Transactional aggregates (xVLS power sums)
	YesVotes     int64 `firestore:"yes_votes" json:"yes_votes"`
	NoVotes      int64 `firestore:"no_votes" json:"no_votes"`
	AbstainVotes int64 `firestore:"abstain_votes" json:"abstain_votes"`
	TotalVotes   int64 `firestore:"total_votes" json:"total_votes"`
}

// Vote represents an individual vote cast on a proposal, stored in a subcollection.
// This struct contains all details about a specific user's vote, including their voting power
// at the time of voting and any additional context provided with the vote.
type Vote struct {
	ProposalID string    `firestore:"proposal_id" json:"proposal_id"` // ID of the proposal this vote was cast on
	Voter      string    `firestore:"voter" json:"voter"`             // Address of the user who cast the vote
	VoteChoice string    `firestore:"vote_choice" json:"vote_choice"` // Vote choice: "YES", "NO", or "ABSTAIN"
	Reason     string    `firestore:"reason" json:"reason"`           // Optional reason provided by the voter
	XVLSAmount int64     `firestore:"xvls_amount" json:"xvls_amount"` // Voting power (xVLS balance) at time of voting
	Timestamp  time.Time `firestore:"timestamp" json:"timestamp"`     // When the vote was cast
}

// PendingUnstake represents a pending unstaking operation stored in a user's subcollection.
// This struct tracks unstaking operations that are in the cooldown period before tokens can be withdrawn.
type PendingUnstake struct {
	Amount    int64     `firestore:"amount" json:"amount"`       // Amount of VLS tokens being unstaked (in denom units)
	Delegatee string    `firestore:"delegatee" json:"delegatee"` // Address of the delegatee being unstaked from
	UnlockAt  time.Time `firestore:"unlock_at" json:"unlock_at"` // Timestamp when the unstake can be completed
}

// User represents the complete structure of a user document stored in Firestore.
// This struct contains all user-related fields that are tracked by the system,
// including governance membership and staking delegation data.
type User struct {
	Address   string           `firestore:"address" json:"address"`       // User's blockchain address (used as document ID)
	DAOMember bool             `firestore:"dao_member" json:"dao_member"` // Whether the user is a member of the DAO
	StakedVLS map[string]int64 `firestore:"staked_vls" json:"staked_vls"` // Map of delegatee addresses to staked VLS amounts
	CreatedAt time.Time        `firestore:"created_at" json:"created_at"` // Timestamp when the user document was first created
}

// Market represents the complete structure of a market document stored in Firestore.
// This struct contains all market-related fields that are tracked by the system,
// including totals, parameters, and current APRs for display in market listings.
type Market struct {
	ID               string    `firestore:"id" json:"id"`                                 // Market identifier (same as marketId)
	LoanToken        string    `firestore:"loan_token" json:"loan_token"`                 // Loan token path
	CollateralToken  string    `firestore:"collateral_token" json:"collateral_token"`     // Collateral token path
	TotalSupply      string    `firestore:"total_supply" json:"total_supply"`             // Total supply amount (u256 string)
	TotalBorrow      string    `firestore:"total_borrow" json:"total_borrow"`             // Total borrow amount (u256 string)
	CurrentSupplyAPR float64   `firestore:"current_supply_apr" json:"current_supply_apr"` // Current supply APR (percentage)
	CurrentBorrowAPR float64   `firestore:"current_borrow_apr" json:"current_borrow_apr"` // Current borrow APR (percentage)
	UtilizationRate  float64   `firestore:"utilization_rate" json:"utilization_rate"`     // Current utilization rate (borrow/supply) as percentage
	CreatedAt        time.Time `firestore:"created_at" json:"created_at"`                 // When the market was created
	UpdatedAt        time.Time `firestore:"updated_at" json:"updated_at"`                 // Last time market data was updated
}

// APRHistory represents a single APR history entry stored in the apr subcollection.
// This struct contains the supply and borrow APRs at a specific point in time.
type APRHistory struct {
	Timestamp time.Time `firestore:"timestamp" json:"timestamp"`   // When this APR snapshot was taken
	SupplyAPR float64   `firestore:"supply_apr" json:"supply_apr"` // Supply APR at this timestamp (percentage)
	BorrowAPR float64   `firestore:"borrow_apr" json:"borrow_apr"` // Borrow APR at this timestamp (percentage)
}

// TotalSupplyHistory represents a single total supply history entry stored in the total_supply subcollection.
// This struct contains the supply amount change at a specific point in time.
type TotalSupplyHistory struct {
	AmountDelta string    `firestore:"amount_delta" json:"amount_delta"` // Change in supply amount (u256 string)
	IsSupply    bool      `firestore:"is_supply" json:"is_supply"`       // Whether this is a supply (true) or withdraw (false)
	Timestamp   time.Time `firestore:"timestamp" json:"timestamp"`       // When this supply/withdraw event occurred
	Total       string    `firestore:"total" json:"total"`               // Total supply amount after this change (u256 string)
}

// TotalBorrowHistory represents a single total borrow history entry stored in the total_borrow subcollection.
// This struct contains the borrow amount change at a specific point in time.
type TotalBorrowHistory struct {
	AmountDelta string    `firestore:"amount_delta" json:"amount_delta"` // Change in borrow amount (u256 string)
	IsBorrow    bool      `firestore:"is_borrow" json:"is_borrow"`       // Whether this is a borrow (true) or repay (false)
	Timestamp   time.Time `firestore:"timestamp" json:"timestamp"`       // When this borrow/repay event occurred
	Total       string    `firestore:"total" json:"total"`               // Total borrow amount after this change (u256 string)
}

// UtilizationHistory represents a single utilization history entry stored in the utilization subcollection.
// This struct contains the utilization rate at a specific point in time.
type UtilizationHistory struct {
	Timestamp       time.Time `firestore:"timestamp" json:"timestamp"`               // When this utilization snapshot was taken
	UtilizationRate float64   `firestore:"utilization_rate" json:"utilization_rate"` // Utilization rate as percentage
}
