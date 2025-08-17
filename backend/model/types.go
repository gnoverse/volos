package model

import "time"

const VolosPkgPath = "gno.land/r/volos/core"              // the package path of the Volos contract
const VolosGovPkgPath = "gno.land/r/volos/gov/governance" // the package path of the Volos governance contract
const Rpc = "http://localhost:26657"                      // the RPC endpoint of the node
const BlockHeightOnDeploy = 0                             // the block height of the deployment of the Volos contract

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

// ProposalData represents the complete structure of a governance proposal document stored in Firestore.
// This struct contains all fields that are persisted to the database when a proposal is created,
// including metadata, voting statistics, and timestamps for tracking proposal lifecycle.
type ProposalData struct {
	ID           string    `firestore:"id"`            // Unique proposal identifier from the governance contract
	Title        string    `firestore:"title"`         // Human-readable title of the proposal
	Body         string    `firestore:"body"`          // Detailed description and content of the proposal
	Proposer     string    `firestore:"proposer"`      // Address of the user who created the proposal
	Deadline     time.Time `firestore:"deadline"`      // Unix timestamp when voting period ends
	Status       string    `firestore:"status"`        // Current status: "active", "passed", "failed", "executed"
	CreatedAt    time.Time `firestore:"created_at"`    // Timestamp when proposal was created in database
	LastVote     time.Time `firestore:"last_vote"`     // Timestamp of the last vote cast on this proposal
	YesVotes     int64     `firestore:"yes_votes"`     // Total voting power of "YES" votes cast
	NoVotes      int64     `firestore:"no_votes"`      // Total voting power of "NO" votes cast
	AbstainVotes int64     `firestore:"abstain_votes"` // Total voting power of "ABSTAIN" votes cast
	TotalVotes   int64     `firestore:"total_votes"`   // Sum of all voting power cast (yes + no + abstain)
	Quorum       int64     `firestore:"quorum"`        // Quorum for the proposal
}

// ProposalFields represents the extracted fields from a governance proposal creation event.
// This struct is used as an intermediate data structure when parsing transaction events
// from the blockchain before storing them in the database. It contains only the essential
// fields that are emitted by the governance contract during proposal creation.
type ProposalFields struct {
	ID        string `json:"id"`        // Unique proposal identifier from the governance contract
	Title     string `json:"title"`     // Human-readable title of the proposal
	Body      string `json:"body"`      // Detailed description and content of the proposal
	Proposer  string `json:"proposer"`  // Address of the user who created the proposal
	Deadline  string `json:"deadline"`  // Unix timestamp string when voting period ends
	Quorum    string `json:"quorum"`    // Quorum for the proposal
	Timestamp string `json:"timestamp"` // Unix timestamp string when the proposal was created
}

// VoteData represents an individual vote cast on a proposal, stored in a subcollection.
// This struct contains all details about a specific user's vote, including their voting power
// at the time of voting and any additional context provided with the vote.
type VoteData struct {
	ProposalID string    `firestore:"proposal_id"` // ID of the proposal this vote was cast on
	Voter      string    `firestore:"voter"`       // Address of the user who cast the vote
	VoteChoice string    `firestore:"vote_choice"` // Vote choice: "YES", "NO", or "ABSTAIN"
	Reason     string    `firestore:"reason"`      // Optional reason provided by the voter
	XVLSAmount int64     `firestore:"xvls_amount"` // Voting power (xVLS balance) at time of voting
	Timestamp  time.Time `firestore:"timestamp"`   // When the vote was cast
}

// UserData represents the complete structure of a user document stored in Firestore.
// This struct contains all user-related fields that are tracked by the system,
// including governance membership and other user-specific data.
// TODO: add more fields
type UserData struct {
	Address   string    `firestore:"address"`    // User's blockchain address (used as document ID)
	DAOMember bool      `firestore:"dao_member"` // Whether the user is a member of the DAO
	CreatedAt time.Time `firestore:"created_at"` // Timestamp when the user document was first created
}
