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
