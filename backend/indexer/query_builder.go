package indexer

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

const txIndexerUrl = "http://localhost:3100"

// QueryBuilder helps build and execute GraphQL queries for the indexer
type QueryBuilder struct {
	OperationName string
	Fields        string
	WhereBuilder  *WhereClauseBuilder
}

func NewQueryBuilder(operationName, fields string) *QueryBuilder {
	return &QueryBuilder{
		OperationName: operationName,
		Fields:        fields,
		WhereBuilder:  NewWhereClauseBuilder(),
	}
}

func (qb *QueryBuilder) Where() *WhereClauseBuilder {
	return qb.WhereBuilder
}

func (qb *QueryBuilder) UseFields(fields string) *QueryBuilder {
	qb.Fields = fields
	return qb
}

func (qb *QueryBuilder) AddFields(fields string) *QueryBuilder {
	qb.Fields += "\n" + fields
	return qb
}

func (qb *QueryBuilder) Build() string {
	whereClause := qb.WhereBuilder.Build()
	return fmt.Sprintf(`
		query %s {
			getTransactions(
				where: {
					%s
				}
			) {
				%s
			}
		}
	`, qb.OperationName, whereClause, qb.Fields)
}

// Execute sends the query to the indexer and returns the raw response
func (qb *QueryBuilder) Execute() ([]byte, error) {
	query := qb.Build()
	body := map[string]interface{}{
		"query":         query,
		"operationName": qb.OperationName,
	}
	jsonBody, _ := json.Marshal(body)
	resp, err := http.Post(txIndexerUrl+"/graphql/query", "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	return io.ReadAll(resp.Body)
}

// WhereClauseBuilder helps build the where clause for GraphQL queries
type WhereClauseBuilder struct {
	conditions      []string
	eventConditions []string
}

func NewWhereClauseBuilder() *WhereClauseBuilder {
	return &WhereClauseBuilder{
		conditions:      []string{},
		eventConditions: []string{},
	}
}

func (w *WhereClauseBuilder) Success(success bool) *WhereClauseBuilder {
	w.conditions = append(w.conditions, fmt.Sprintf("success: { eq: %v }", success))
	return w
}

func (w *WhereClauseBuilder) BlockHeightRange(min, max *int) *WhereClauseBuilder {
	parts := []string{}
	if min != nil {
		parts = append(parts, fmt.Sprintf("gt: %d", *min))
	}
	if max != nil {
		parts = append(parts, fmt.Sprintf("lt: %d", *max))
	}
	if len(parts) > 0 {
		w.conditions = append(w.conditions, fmt.Sprintf("block_height: { %s }", strings.Join(parts, ", ")))
	}
	return w
}

func (w *WhereClauseBuilder) EventType(eventType string) *WhereClauseBuilder {
	w.eventConditions = append(w.eventConditions, fmt.Sprintf(`type: { eq: "%s" }`, eventType))
	return w
}

func (w *WhereClauseBuilder) MarketId(marketId string) *WhereClauseBuilder {
	w.eventConditions = append(w.eventConditions, fmt.Sprintf(`attrs: { key: { eq: "market_id" }, value: { eq: "%s" } }`, marketId))
	return w
}

func (w *WhereClauseBuilder) Caller(caller string) *WhereClauseBuilder {
	w.conditions = append(w.conditions, fmt.Sprintf(`
		messages: {
			value: {
				MsgCall: {
					caller: { eq: "%s" }
				}
			}
		}
	`, caller))
	return w
}

func (w *WhereClauseBuilder) Add(condition string) *WhereClauseBuilder {
	w.conditions = append(w.conditions, condition)
	return w
}

func (w *WhereClauseBuilder) Build() string {
	allConditions := append([]string{}, w.conditions...)
	if len(w.eventConditions) > 0 {
		eventCondition := fmt.Sprintf(`
			response: {
				events: {
					GnoEvent: {
						%s
					}
				}
			}
		`, strings.Join(w.eventConditions, "\n"))
		allConditions = append(allConditions, eventCondition)
	}
	return strings.Join(allConditions, "\n")
}

func (w *WhereClauseBuilder) Reset() *WhereClauseBuilder {
	w.conditions = []string{}
	w.eventConditions = []string{}
	return w
}
