package indexer

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
)

func FetchIndexerData(query string, operationName string) ([]byte, error) {
	body := map[string]interface{}{
		"query":         query,
		"operationName": operationName,
	}

	jsonBody, _ := json.Marshal(body)
	resp, err := http.Post(txIndexerUrl+"/graphql/query", "application/json", bytes.NewBuffer(jsonBody))

	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()
	return io.ReadAll(resp.Body)
}
