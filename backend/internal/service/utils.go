package service

import "strconv"

// Helper to process events from transactions and collect unique block heights
func extractEvents(transactions []map[string]interface{}, sign float64, heightSet map[int64]struct{}) []Event {
	var events []Event
	for _, tx := range transactions {
		timestamp := int64(0)
		if ts, ok := tx["block_height"].(float64); ok {
			timestamp = int64(ts)
		}
		if response, ok := tx["response"].(map[string]interface{}); ok {
			if eventsArr, ok := response["events"].([]interface{}); ok {
				for _, ev := range eventsArr {
					if evMap, ok := ev.(map[string]interface{}); ok {
						if attrs, ok := evMap["attrs"].([]interface{}); ok {
							for _, attr := range attrs {
								if attrMap, ok := attr.(map[string]interface{}); ok {
									if attrMap["key"] == "amount" {
										amountStr := attrMap["value"].(string)
										if amountStr != "" {
											if val, err := strconv.ParseFloat(amountStr, 64); err == nil {
												events = append(events, Event{Value: sign * val, BlockHeight: timestamp})
												heightSet[timestamp] = struct{}{}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}
	return events
}
