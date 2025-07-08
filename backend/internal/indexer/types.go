package indexer

type GnoEventAttr struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

type GnoEvent struct {
	Type  string         `json:"type"`
	Func  string         `json:"func,omitempty"`
	Attrs []GnoEventAttr `json:"attrs"`
}

type MsgCall struct {
	Caller  string   `json:"caller"`
	Send    string   `json:"send,omitempty"`
	PkgPath string   `json:"pkg_path,omitempty"`
	Func    string   `json:"func,omitempty"`
	Args    []string `json:"args,omitempty"`
}

type TransactionMessage struct {
	TypeUrl string   `json:"typeUrl,omitempty"`
	Route   string   `json:"route,omitempty"`
	Value   *MsgCall `json:"value,omitempty"`
}

type Transaction struct {
	BlockHeight int64                `json:"block_height"`
	Index       int                  `json:"index,omitempty"`
	Hash        string               `json:"hash,omitempty"`
	Messages    []TransactionMessage `json:"messages,omitempty"`
	Response    struct {
		Events []GnoEvent `json:"events"`
	} `json:"response"`
}

type TransactionData struct {
	BlockHeight int64          `json:"block_height"`
	Index       int            `json:"index,omitempty"`
	Hash        string         `json:"hash,omitempty"`
	Caller      string         `json:"caller,omitempty"`
	Send        string         `json:"send,omitempty"`
	PkgPath     string         `json:"pkg_path,omitempty"`
	Func        string         `json:"func,omitempty"`
	Args        []string       `json:"args,omitempty"`
	EventType   string         `json:"event_type,omitempty"`
	EventFunc   string         `json:"event_func,omitempty"`
	EventAttrs  []GnoEventAttr `json:"event_attrs,omitempty"`
	Amount      string         `json:"amount,omitempty"`
	MarketId    string         `json:"market_id,omitempty"`
	Timestamp   int64          `json:"timestamp,omitempty"`
}

type ChartData struct {
	Value     float64 `json:"value"`
	Timestamp int64   `json:"timestamp,omitempty"`
}

type MarketActivity struct {
	BlockHeight int64  `json:"block_height"`
	Type        string `json:"type"`
	Amount      string `json:"amount"`
	Caller      string `json:"caller"`
	TxHash      string `json:"tx_hash"`
	Func        string `json:"func,omitempty"`
	Timestamp   int64  `json:"timestamp"`
}
