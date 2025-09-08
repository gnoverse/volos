package processor

import (
	"log/slog"
	"strconv"
)

// extractEventFields is a universal function that extracts specified fields from an event's attributes.
// It returns a map of field names to their values, and a boolean indicating if all required fields were found.
//
// Parameters:
//   - event: The event map containing the "attrs" array
//   - requiredFields: Array of field names that must be present for success
//   - optionalFields: Array of field names that are optional (can be empty)
//
// Returns:
//   - map[string]string: Field name to value mapping
//   - bool: True if all required fields were found, false otherwise
func extractEventFields(event map[string]interface{}, requiredFields []string, optionalFields []string) (map[string]string, bool) {
	attributes, ok := event["attrs"].([]interface{})
	if !ok {
		return nil, false
	}

	result := make(map[string]string)

	for _, field := range optionalFields {
		result[field] = ""
	}

	for _, attr := range attributes {
		attrMap, ok := attr.(map[string]interface{})
		if !ok {
			continue
		}

		key, _ := attrMap["key"].(string)
		value, _ := attrMap["value"].(string)

		if key != "" {
			result[key] = value
		}
	}

	for _, field := range requiredFields {
		if result[field] == "" {
			return nil, false
		}
	}

	return result, true
}

// extractCallerAndHash extracts the caller and tx hash from the transaction object.
// Uses only the first message from the array-based messages shape. Logs errors and returns empty strings on failure.
func extractTxInfo(tx map[string]interface{}) (string, string, string) {
	msgs, ok := tx["messages"].([]interface{})
	if !ok || len(msgs) == 0 {
		slog.Error("transaction messages missing or empty", "tx", tx)
		return "", "", ""
	}

	index, ok := tx["index"].(float64)
	if !ok {
		slog.Error("transaction index missing", "tx", tx)
		return "", "", ""
	}

	first, ok := msgs[0].(map[string]interface{})
	if !ok {
		slog.Error("first message is not a map", "messages[0]", msgs[0])
		return "", "", ""
	}

	value, ok := first["value"].(map[string]interface{})
	if !ok {
		slog.Error("message value is not a map", "message", first)
		return "", "", ""
	}

	caller, ok := value["caller"].(string)
	if !ok || caller == "" {
		slog.Error("caller missing in message value", "value", value)
		caller = ""
	}

	hash, _ := tx["hash"].(string)
	if hash == "" {
		slog.Error("transaction hash missing", "tx", tx)
	}

	return caller, hash, strconv.Itoa(int(index))
}

// Top-level parse helpers for core processor

func extractEventsFromTx(tx map[string]interface{}) []interface{} {
	response, ok := tx["response"].(map[string]interface{})
	if !ok {
		slog.Error("transaction missing 'response' field", "tx", tx)
		return nil
	}

	events, ok := response["events"].([]interface{})
	if !ok || len(events) == 0 {
		slog.Error("transaction missing or empty 'events' array", "response", response)
		return nil
	}

	return events
}

func getEventAndType(eventInterface interface{}) (map[string]interface{}, string) {
	event, ok := eventInterface.(map[string]interface{})
	if !ok {
		slog.Error("event is not a map", "event_interface", eventInterface)
		return nil, ""
	}

	eventType, ok := event["type"].(string)
	if !ok || eventType == "" {
		slog.Error("event type is not a string", "event", event)
		return nil, ""
	}
	return event, eventType
}
