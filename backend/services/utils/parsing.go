package utils

import (
	"log/slog"
	"math/big"
	"strconv"
)

// ParseTimestamp parses a timestamp string to int64, logs errors and returns 0 on failure
func ParseTimestamp(timestamp string, context string) int64 {
	if timestamp == "" {
		slog.Error("Empty timestamp", "context", context)
		return 0
	}

	parsed, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil {
		slog.Error("failed to parse timestamp", "context", context, "timestamp", timestamp, "error", err)
		return 0
	}
	return parsed
}

// ParseAmount parses an amount string to big.Int, logs errors and returns 0 on failure
func ParseAmount(amount string, context string) *big.Int {
	if amount == "" {
		slog.Error("Empty amount", "context", context)
		return big.NewInt(0)
	}

	parsed, ok := new(big.Int).SetString(amount, 10)
	if !ok || parsed.Sign() < 0 {
		slog.Error("failed to parse amount", "context", context, "amount", amount)
		return big.NewInt(0)
	}
	return parsed
}

// ParseInt64 parses a string to int64, logs errors and returns 0 on failure
func ParseInt64(value string, context string) int64 {
	if value == "" {
		slog.Error("Empty int64 value", "context", context)
		return 0
	}

	parsed, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		slog.Error("failed to parse int64", "context", context, "value", value, "error", err)
		return 0
	}
	return parsed
}
