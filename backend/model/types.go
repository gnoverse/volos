package model

import (
	"os"
	"time"

	_ "github.com/joho/godotenv/autoload"
)

const CorePkgPath = "gno.land/r/volos/core"                 // the package path of the Volos core contract
const GovernancePkgPath = "gno.land/r/volos/gov/governance" // the package path of the Volos governance contract
const StakerPkgPath = "gno.land/r/volos/gov/staker"         // the package path of the Volos staker contract
const VlsPkgPath = "gno.land/r/volos/gov/vls"               // the package path of the Volos vls contract
const XvlsPkgPath = "gno.land/r/volos/gov/xvls"             // the package path of the Volos xvls contract
const GnoswapPool = "gno.land/r/gnoswap/v1/pool"            // the package path of the Gnoswap pool contract

var Rpc = func() string {
	if url := os.Getenv("RPC_NODE_URL"); url != "" {
		return url
	}
	return "http://localhost:26657"
}()

const BlockHeightOnDeploy = 0 // the block height of the deployment of the Volos contract

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
	ID                      string    `firestore:"id" json:"id"`                                               // Market identifier (same as marketId)
	LoanToken               string    `firestore:"loan_token" json:"loan_token"`                               // Loan token path
	CollateralToken         string    `firestore:"collateral_token" json:"collateral_token"`                   // Collateral token path
	LoanTokenName           string    `firestore:"loan_token_name" json:"loan_token_name"`                     // Loan token name
	LoanTokenSymbol         string    `firestore:"loan_token_symbol" json:"loan_token_symbol"`                 // Loan token symbol
	LoanTokenDecimals       int64     `firestore:"loan_token_decimals" json:"loan_token_decimals"`             // Loan token decimals
	CollateralTokenName     string    `firestore:"collateral_token_name" json:"collateral_token_name"`         // Collateral token name
	CollateralTokenSymbol   string    `firestore:"collateral_token_symbol" json:"collateral_token_symbol"`     // Collateral token symbol
	CollateralTokenDecimals int64     `firestore:"collateral_token_decimals" json:"collateral_token_decimals"` // Collateral token decimals
	CurrentPrice            string    `firestore:"current_price" json:"current_price"`                         // Current price of the loan token in terms of collateral token (u256 string)
	TotalSupply             string    `firestore:"total_supply" json:"total_supply"`                           // Total supply amount (u256 string)
	TotalBorrow             string    `firestore:"total_borrow" json:"total_borrow"`                           // Total borrow amount (u256 string)
	SupplyAPR               string   `firestore:"supply_apr" json:"supply_apr"`                               // Current supply APR (percentage)
	BorrowAPR               string   `firestore:"borrow_apr" json:"borrow_apr"`                               // Current borrow APR (percentage)
	UtilizationRate         string   `firestore:"utilization_rate" json:"utilization_rate"`                   // Current utilization rate (borrow/supply) as percentage
	CreatedAt               time.Time `firestore:"created_at" json:"created_at"`                               // When the market was created
	UpdatedAt               time.Time `firestore:"updated_at" json:"updated_at"`                               // Last time market data was updated
	LLTV                    string   `firestore:"lltv" json:"lltv"`                                           // Liquidation Loan-to-Value ratio (WAD-scaled, e.g., 75% = 0.75 * 1e18)
}

// APRHistory represents a single APR history entry stored in the apr subcollection.
// This struct contains the supply and borrow APRs at a specific point in time.
type APRHistory struct {
	Timestamp time.Time `firestore:"timestamp" json:"timestamp"`   // When this APR snapshot was taken
	SupplyAPR string   `firestore:"supply_apr" json:"supply_apr"` // Supply APR at this timestamp (percentage)
	BorrowAPR string   `firestore:"borrow_apr" json:"borrow_apr"` // Borrow APR at this timestamp (percentage)
}

// MarketHistory represents a single market history entry stored in the market_history subcollection.
// This struct contains the change in market totals at a specific point in time for any event type.
type MarketHistory struct {
	Timestamp time.Time `firestore:"timestamp" json:"timestamp"`   // When this event occurred
	Value     string    `firestore:"value" json:"value"`           // Total amount after this change (u256 string)
	Delta     string    `firestore:"delta" json:"delta"`           // Change in amount (u256 string)
	Operation string    `firestore:"operation" json:"operation"`   // "+" for increases, "-" for decreases
	Caller    string    `firestore:"caller" json:"caller"`         // Address of the user who triggered this event
	TxHash    string    `firestore:"tx_hash" json:"tx_hash"`       // Transaction hash that caused this event
	EventType string    `firestore:"event_type" json:"event_type"` // Type of event: "Supply", "Withdraw", "Borrow", "Repay", "Liquidate", "SupplyCollateral", "WithdrawCollateral"
	LoanPrice float64   `firestore:"loan_price" json:"loan_price"` // Price of the loan token at the time of the event
}

// UtilizationHistory represents a single utilization history entry stored in the utilization subcollection.
// This struct contains the utilization rate at a specific point in time.
type UtilizationHistory struct {
	Timestamp time.Time `firestore:"timestamp" json:"timestamp"` // When this utilization snapshot was taken
	Value     string   `firestore:"value" json:"value"`         // Utilization rate as percentage
}

// UserLoan represents a single borrow/repay event for charting.
// This struct contains user loan activity data suitable for time-series charts.
type UserLoan struct {
	Value                 string    `json:"value"`                   // Total value after the event (u256 string, USD value)
	Timestamp             time.Time `json:"timestamp"`               // When the event occurred
	MarketID              string    `json:"marketId"`                // Which market this event was in
	EventType             string    `json:"eventType"`               // Type of event: "Borrow" or "Repay"
	Operation             string    `json:"operation"`               // Operation: "+" for increases, "-" for decreases
	LoanTokenSymbol       string    `json:"loan_token_symbol"`       // Loan token symbol
	CollateralTokenSymbol string    `json:"collateral_token_symbol"` // Collateral token symbol
}

// UserMarketPosition represents per-market aggregates for a user stored under users/{address}/markets/{marketId}
type UserMarketPosition struct {
	Borrow           string  `json:"borrow" firestore:"borrow"`
	Supply           string  `json:"supply" firestore:"supply"`
	CollateralSupply string  `json:"collateral_supply" firestore:"collateral_supply"`
}
