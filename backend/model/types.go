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
	Caller       string    `firestore:"caller"`        // Address of the user who created the proposal
	Deadline     time.Time `firestore:"deadline"`      // Unix timestamp when voting period ends
	Status       string    `firestore:"status"`        // Current status: "active", "passed", "failed", "executed"
	CreatedAt    time.Time `firestore:"created_at"`    // Timestamp when proposal was created in database
	UpdatedAt    time.Time `firestore:"updated_at"`    // Timestamp of last database update
	YesVotes     int64     `firestore:"yes_votes"`     // Total voting power of "YES" votes cast
	NoVotes      int64     `firestore:"no_votes"`      // Total voting power of "NO" votes cast
	AbstainVotes int64     `firestore:"abstain_votes"` // Total voting power of "ABSTAIN" votes cast
	TotalVotes   int64     `firestore:"total_votes"`   // Sum of all voting power cast (yes + no + abstain)
}

// ProposalFields represents the extracted fields from a governance proposal creation event.
// This struct is used as an intermediate data structure when parsing transaction events
// from the blockchain before storing them in the database. It contains only the essential
// fields that are emitted by the governance contract during proposal creation.
type ProposalFields struct {
	ID       string `json:"id"`       // Unique proposal identifier from the governance contract
	Title    string `json:"title"`    // Human-readable title of the proposal
	Body     string `json:"body"`     // Detailed description and content of the proposal
	Caller   string `json:"caller"`   // Address of the user who created the proposal
	Deadline string `json:"deadline"` // Unix timestamp string when voting period ends
}
