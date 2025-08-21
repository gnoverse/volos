package utils

import (
	"log/slog"
	"math/big"
)

func WadToPercent(wad string, context string) float64 {
	if wad == "" {
		slog.Error("Empty WAD", "context", context)
		return 0
	}
	bi, ok := new(big.Int).SetString(wad, 10)
	if !ok {
		slog.Error("failed to parse WAD", "context", context, "wad", wad)
		return 0
	}
	// percent = (wad / 1e18) * 100
	f, _ := new(big.Rat).SetInt(bi).Float64()
	return (f / 1e18) * 100
}
