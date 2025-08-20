// note: this file is used to build the GraphQL queries for the indexer. currently not used since the queries' complexity is too dynamic in the development.
// in the future i plan to develop a query builder in a separate repo.
package indexer

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
)

const txIndexerUrl = "http://localhost:3100"

// QueryBuilder helps build and execute GraphQL queries for the indexer
type QueryBuilder struct {
	OperationName  string
	Fields         string
	WhereBuilder   *WhereClauseBuilder
	IsSubscription bool
}

func NewQueryBuilder(operationName, fields string) *QueryBuilder {
	return &QueryBuilder{
		OperationName:  operationName,
		Fields:         fields,
		WhereBuilder:   NewWhereClauseBuilder(),
		IsSubscription: false,
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

func (qb *QueryBuilder) Subscription() *QueryBuilder {
	qb.IsSubscription = true
	return qb
}

func (qb *QueryBuilder) Build() string {
	whereClause := qb.WhereBuilder.Build()
	operationType := "query"
	if qb.IsSubscription {
		operationType = "subscription"
	}

	if qb.IsSubscription {
		return fmt.Sprintf(`
		%s {
			getTransactions(
				where: {
					%s
				}
			) {
				%s
			}
		}
	`, operationType, whereClause, qb.Fields)
	}

	return fmt.Sprintf(`
		%s %s {
			getTransactions(
				where: {
					%s
				}
			) {
				%s
			}
		}
	`, operationType, qb.OperationName, whereClause, qb.Fields)
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
		slog.Error("query builder request failed",
			"operation", qb.OperationName,
			"error", err,
		)
		return nil, err
	}
	defer resp.Body.Close()
	return io.ReadAll(resp.Body)
}

// WhereClauseBuilder helps build the where clause for GraphQL queries
type WhereClauseBuilder struct {
	conditions        []string
	eventConditions   []string
	msgCallConditions []string
	logicalOperator   string // "_or" or "_and"
}

func NewWhereClauseBuilder() *WhereClauseBuilder {
	return &WhereClauseBuilder{
		conditions:        []string{},
		eventConditions:   []string{},
		msgCallConditions: []string{},
		logicalOperator:   "",
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
	w.msgCallConditions = append(w.msgCallConditions, fmt.Sprintf(`caller: { eq: "%s" }`, caller))
	return w
}

func (w *WhereClauseBuilder) PkgPath(pkgPath string) *WhereClauseBuilder {
	w.msgCallConditions = append(w.msgCallConditions, fmt.Sprintf(`pkg_path: { eq: "%s" }`, pkgPath))
	return w
}

func (w *WhereClauseBuilder) Or() *WhereClauseBuilder {
	w.logicalOperator = "_or"
	return w
}

func (w *WhereClauseBuilder) And() *WhereClauseBuilder {
	w.logicalOperator = "_and"
	return w
}

func (w *WhereClauseBuilder) Add(condition string) *WhereClauseBuilder {
	w.conditions = append(w.conditions, condition)
	return w
}

func (w *WhereClauseBuilder) Build() string {
	allConditions := append([]string{}, w.conditions...)

	if len(w.msgCallConditions) > 0 {
		if w.logicalOperator != "" {
			wrappedConditions := make([]string, len(w.msgCallConditions))
			for i, condition := range w.msgCallConditions {
				wrappedConditions[i] = fmt.Sprintf("{%s}", condition)
			}
			msgCallCondition := fmt.Sprintf(`
				messages: {
					value: {
						MsgCall: {
							%s: [
								%s
							]
						}
					}
				}
			`, w.logicalOperator, strings.Join(wrappedConditions, ",\n"))
			allConditions = append(allConditions, msgCallCondition)
		} else {
			msgCallCondition := fmt.Sprintf(`
				messages: {
					value: {
						MsgCall: {
							%s
						}
					}
				}
			`, strings.Join(w.msgCallConditions, "\n"))
			allConditions = append(allConditions, msgCallCondition)
		}
	}

	if len(w.eventConditions) > 0 {
		if w.logicalOperator != "" {
			wrappedConditions := make([]string, len(w.eventConditions))
			for i, condition := range w.eventConditions {
				wrappedConditions[i] = fmt.Sprintf("{%s}", condition)
			}
			eventCondition := fmt.Sprintf(`
				response: {
					events: {
						GnoEvent: {
							%s: [
								%s
							]
						}
					}
				}
			`, w.logicalOperator, strings.Join(wrappedConditions, ",\n"))
			allConditions = append(allConditions, eventCondition)
		} else {
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
	}
	return strings.Join(allConditions, "\n")
}

func (w *WhereClauseBuilder) Reset() *WhereClauseBuilder {
	w.conditions = []string{}
	w.eventConditions = []string{}
	w.msgCallConditions = []string{}
	w.logicalOperator = ""
	return w
}
