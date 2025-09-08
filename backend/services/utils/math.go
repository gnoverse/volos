package utils

import (
	"log/slog"
	"math/big"
)

var WAD = big.NewInt(1e18)
var VIRTUAL_SHARES = big.NewInt(1e9) // 1 billion virtual shares
var VIRTUAL_ASSETS = big.NewInt(1)   // 1 base unit

// WMulDown returns (x * y) / WAD rounded down
func WMulDown(x, y *big.Int) *big.Int {
	result := MulDivDown(x, y, WAD)
	return result
}

// WMulUp returns (x * y) / WAD rounded up
func WMulUp(x, y *big.Int) *big.Int {
	result := MulDivUp(x, y, WAD)
	return result
}

// WDivDown returns (x * WAD) / y rounded down
func WDivDown(x, y *big.Int) *big.Int {
	result := MulDivDown(x, WAD, y)
	return result
}

// WDivUp returns (x * WAD) / y rounded up
func WDivUp(x, y *big.Int) *big.Int {
	result := MulDivUp(x, WAD, y)
	return result
}

// MulDivDown multiplies two numbers and divides by a third, rounding down
func MulDivDown(a, b, denominator *big.Int) *big.Int {
	if a == nil || b == nil || denominator == nil {
		slog.Error("nil input to MulDivDown")
		return big.NewInt(0)
	}

	if denominator.Sign() == 0 {
		slog.Error("division by zero in MulDivDown")
		return big.NewInt(0)
	}

	result := new(big.Int).Mul(a, b)
	return new(big.Int).Div(result, denominator)
}

// MulDivUp multiplies two numbers and divides by a third, rounding up
func MulDivUp(a, b, denominator *big.Int) *big.Int {
	if a == nil || b == nil || denominator == nil {
		slog.Error("nil input to MulDivUp")
		return big.NewInt(0)
	}

	if denominator.Sign() == 0 {
		slog.Error("division by zero in MulDivUp")
		return big.NewInt(0)
	}

	result := new(big.Int).Mul(a, b)
	remainder := new(big.Int).Mod(result, denominator)
	quotient := new(big.Int).Div(result, denominator)

	if remainder.Sign() > 0 {
		quotient.Add(quotient, big.NewInt(1))
	}

	return quotient
}

// ToSharesDown converts assets to shares, rounding down (used for supply)
// This is used when a user supplies assets and we need to calculate how many shares they receive
func ToSharesDown(assets, totalAssets, totalShares *big.Int) *big.Int {
	if assets == nil || totalAssets == nil || totalShares == nil {
		slog.Error("nil input to ToSharesDown")
		return big.NewInt(0)
	}

	totalSharesWithVirtual := new(big.Int).Add(totalShares, VIRTUAL_SHARES)
	totalAssetsWithVirtual := new(big.Int).Add(totalAssets, VIRTUAL_ASSETS)

	return MulDivDown(
		assets,
		totalSharesWithVirtual,
		totalAssetsWithVirtual,
	)
}

// ToSharesUp converts assets to shares, rounding up (used for borrow)
// This is used when a user borrows assets and we need to calculate how many shares they need
func ToSharesUp(assets, totalAssets, totalShares *big.Int) *big.Int {
	if assets == nil || totalAssets == nil || totalShares == nil {
		slog.Error("nil input to ToSharesUp")
		return big.NewInt(0)
	}

	totalSharesWithVirtual := new(big.Int).Add(totalShares, VIRTUAL_SHARES)
	totalAssetsWithVirtual := new(big.Int).Add(totalAssets, VIRTUAL_ASSETS)

	return MulDivUp(
		assets,
		totalSharesWithVirtual,
		totalAssetsWithVirtual,
	)
}
