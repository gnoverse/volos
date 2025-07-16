package model

const VolosPkgPath = "gno.land/r/gnolend" // the package path of the Volos contract
const Rpc = "http://localhost:26657"      // the RPC endpoint of the node
const BlockHeightOnDeploy = 0             // the block height of the deployment of the Volos contract

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
