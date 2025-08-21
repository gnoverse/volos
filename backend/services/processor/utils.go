package processor

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
