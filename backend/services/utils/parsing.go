package utils

import (
	"log/slog"
	"math/big"
	"strconv"
	"strings"
	"time"
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

// ParseTime parses a time string in RFC3339 format, logs errors and returns zero time on failure
func ParseTime(timeStr string, context string) time.Time {
	if timeStr == "" {
		slog.Error("empty time string", "context", context)
		return time.Time{}
	}

	parsed, err := time.Parse(time.RFC3339, timeStr)
	if err != nil {
		slog.Error("failed to parse time", "context", context, "time", timeStr, "error", err)
		return time.Time{}
	}
	return parsed
}

// ParseABCIstring parses an ABCI query response string to extract the value between quotes
// Response format: ("79228162514264337593543950337" string)
func ParseABCIstring(response string, context string) string {
	if response == "" {
		slog.Error("empty ABCI response", "context", context)
		return ""
	}

	if !strings.HasPrefix(response, "(") || !strings.Contains(response, " string)") {
		slog.Error("invalid ABCI response format", "context", context, "response", response)
		return ""
	}

	start := strings.Index(response, "\"")
	end := strings.LastIndex(response, "\"")
	if start == -1 || end == -1 || start >= end {
		slog.Error("failed to extract quoted value from ABCI response", "context", context, "response", response)
		return ""
	}

	value := response[start+1 : end]
	return value
}
