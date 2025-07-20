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
	OperationName        string
	Fields               string
	WhereBuilder         *WhereClauseBuilder
	IsSubscription       bool
	UseTransactionsQuery bool
	FilterClauseStr      string
	FilterBuilder        *FilterClauseBuilder
}

func NewQueryBuilder(operationName, fields string) *QueryBuilder {
	return &QueryBuilder{
		OperationName:        operationName,
		Fields:               fields,
		WhereBuilder:         NewWhereClauseBuilder(),
		IsSubscription:       false,
		UseTransactionsQuery: false,
		FilterClauseStr:      "",
		FilterBuilder:        NewFilterClauseBuilder(),
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

func (qb *QueryBuilder) OriginalTransactionsQuery() *QueryBuilder {
	qb.UseTransactionsQuery = true
	return qb
}

func (qb *QueryBuilder) FilterClause(clause string) *QueryBuilder {
	qb.FilterClauseStr = clause
	return qb
}

func (qb *QueryBuilder) Filter() *FilterClauseBuilder {
	return qb.FilterBuilder
}

func (qb *QueryBuilder) Build() string {
	if qb.UseTransactionsQuery {
		operationType := "query"
		if qb.IsSubscription {
			operationType = "subscription"
		}
		filterClause := qb.FilterBuilder.Build()
		return fmt.Sprintf(`
		%s {
			transactions(
				filter: %s
			) {
				%s
			}
		}
	`, operationType, filterClause, qb.Fields)
	}

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
}

func NewWhereClauseBuilder() *WhereClauseBuilder {
	return &WhereClauseBuilder{
		conditions:        []string{},
		eventConditions:   []string{},
		msgCallConditions: []string{},
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

func (w *WhereClauseBuilder) Add(condition string) *WhereClauseBuilder {
	w.conditions = append(w.conditions, condition)
	return w
}

func (w *WhereClauseBuilder) Build() string {
	allConditions := append([]string{}, w.conditions...)

	if len(w.msgCallConditions) > 0 {
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
	w.msgCallConditions = []string{}
	return w
}

// FilterClauseBuilder helps build the filter clause for transactions queries
type FilterClauseBuilder struct {
	conditions        []string
	eventConditions   []string
	msgCallConditions []string
}

func NewFilterClauseBuilder() *FilterClauseBuilder {
	return &FilterClauseBuilder{
		conditions:        []string{},
		eventConditions:   []string{},
		msgCallConditions: []string{},
	}
}

func (f *FilterClauseBuilder) Success(success bool) *FilterClauseBuilder {
	f.conditions = append(f.conditions, fmt.Sprintf("success: %v", success))
	return f
}

func (f *FilterClauseBuilder) BlockHeightRange(min, max *int) *FilterClauseBuilder {
	parts := []string{}
	if min != nil {
		parts = append(parts, fmt.Sprintf("from_block_height: %d", *min))
	}
	if max != nil {
		parts = append(parts, fmt.Sprintf("to_block_height: %d", *max))
	}
	if len(parts) > 0 {
		f.conditions = append(f.conditions, strings.Join(parts, ", "))
	}
	return f
}

func (f *FilterClauseBuilder) EventType(eventType string) *FilterClauseBuilder {
	f.eventConditions = append(f.eventConditions, fmt.Sprintf(`{ type: "%s" }`, eventType))
	return f
}

func (f *FilterClauseBuilder) MarketId(marketId string) *FilterClauseBuilder {
	f.eventConditions = append(f.eventConditions, fmt.Sprintf(`{ attrs: [{ key: "market_id", value: "%s" }] }`, marketId))
	return f
}

func (f *FilterClauseBuilder) Caller(caller string) *FilterClauseBuilder {
	f.msgCallConditions = append(f.msgCallConditions, fmt.Sprintf(`caller: "%s"`, caller))
	return f
}

func (f *FilterClauseBuilder) PkgPath(pkgPath string) *FilterClauseBuilder {
	f.msgCallConditions = append(f.msgCallConditions, fmt.Sprintf(`pkg_path: "%s"`, pkgPath))
	return f
}

func (f *FilterClauseBuilder) Add(condition string) *FilterClauseBuilder {
	f.conditions = append(f.conditions, condition)
	return f
}

func (f *FilterClauseBuilder) Build() string {
	allConditions := append([]string{}, f.conditions...)

	if len(f.msgCallConditions) > 0 {
		msgCallCondition := fmt.Sprintf(`
			message: [{
				type_url: exec,
				route: vm,
				vm_param: {
					exec: {
						%s
					}
				}
			}]
		`, strings.Join(f.msgCallConditions, ", "))
		allConditions = append(allConditions, msgCallCondition)
	}

	if len(f.eventConditions) > 0 {
		eventCondition := fmt.Sprintf(`
			events: [%s]
		`, strings.Join(f.eventConditions, ", "))
		allConditions = append(allConditions, eventCondition)
	}
	return fmt.Sprintf("{ %s }", strings.Join(allConditions, ", "))
}

func (f *FilterClauseBuilder) Reset() *FilterClauseBuilder {
	f.conditions = []string{}
	f.eventConditions = []string{}
	f.msgCallConditions = []string{}
	return f
}
