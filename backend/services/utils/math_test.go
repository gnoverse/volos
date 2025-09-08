package utils

import (
	"math/big"
	"testing"
)

func TestWMulDown(t *testing.T) {
	tests := []struct {
		name     string
		x        string
		y        string
		expected string
	}{
		{
			name:     "basic multiplication",
			x:        "1000000000000000000", // 1 WAD
			y:        "2000000000000000000", // 2 WAD
			expected: "2000000000000000000", // 2 WAD
		},
		{
			name:     "fractional result rounds down",
			x:        "1500000000000000000", // 1.5 WAD
			y:        "1000000000000000000", // 1 WAD
			expected: "1500000000000000000", // 1.5 WAD
		},
		{
			name:     "small values",
			x:        "1000000000000000", // 0.001 WAD
			y:        "2000000000000000", // 0.002 WAD
			expected: "2000000000000",    // 0.000002 WAD
		},
		{
			name:     "zero values",
			x:        "0",
			y:        "1000000000000000000",
			expected: "0",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			x, _ := new(big.Int).SetString(tt.x, 10)
			y, _ := new(big.Int).SetString(tt.y, 10)
			expected, _ := new(big.Int).SetString(tt.expected, 10)

			result := WMulDown(x, y)
			if result.Cmp(expected) != 0 {
				t.Errorf("WMulDown(%s, %s) = %s, want %s", tt.x, tt.y, result.String(), tt.expected)
			}
		})
	}
}

func TestWDivDown(t *testing.T) {
	tests := []struct {
		name     string
		x        string
		y        string
		expected string
	}{
		{
			name:     "basic division",
			x:        "2000000000000000000", // 2 WAD
			y:        "1000000000000000000", // 1 WAD
			expected: "2000000000000000000", // 2 WAD
		},
		{
			name:     "fractional result rounds down",
			x:        "1500000000000000000", // 1.5 WAD
			y:        "2000000000000000000", // 2 WAD
			expected: "750000000000000000",  // 0.75 WAD
		},
		{
			name:     "small values",
			x:        "2000000000000",    // 0.000002 WAD
			y:        "1000000000000000", // 0.001 WAD
			expected: "2000000000000000", // 0.002 WAD
		},
		{
			name:     "zero dividend",
			x:        "0",
			y:        "1000000000000000000",
			expected: "0",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			x, _ := new(big.Int).SetString(tt.x, 10)
			y, _ := new(big.Int).SetString(tt.y, 10)
			expected, _ := new(big.Int).SetString(tt.expected, 10)

			result := WDivDown(x, y)
			if result.Cmp(expected) != 0 {
				t.Errorf("WDivDown(%s, %s) = %s, want %s", tt.x, tt.y, result.String(), tt.expected)
			}
		})
	}
}

func TestMulDivDown(t *testing.T) {
	tests := []struct {
		name        string
		a           string
		b           string
		denominator string
		expected    string
	}{
		{
			name:        "basic multiply divide",
			a:           "1000000000000000000", // 1 WAD
			b:           "2000000000000000000", // 2 WAD
			denominator: "1000000000000000000", // 1 WAD
			expected:    "2000000000000000000", // 2 WAD
		},
		{
			name:        "fractional result rounds down",
			a:           "1500000000000000000", // 1.5 WAD
			b:           "1000000000000000000", // 1 WAD
			denominator: "2000000000000000000", // 2 WAD
			expected:    "750000000000000000",  // 0.75 WAD
		},
		{
			name:        "averaging example",
			a:           "3000000000000000000", // 3 WAD (total)
			b:           "1",                   // 1
			denominator: "3",                   // 3 (count)
			expected:    "1000000000000000000", // 1 WAD (average)
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			a, _ := new(big.Int).SetString(tt.a, 10)
			b, _ := new(big.Int).SetString(tt.b, 10)
			denominator, _ := new(big.Int).SetString(tt.denominator, 10)
			expected, _ := new(big.Int).SetString(tt.expected, 10)

			result := MulDivDown(a, b, denominator)
			if result.Cmp(expected) != 0 {
				t.Errorf("MulDivDown(%s, %s, %s) = %s, want %s", tt.a, tt.b, tt.denominator, result.String(), tt.expected)
			}
		})
	}
}

func TestParseWADAmount(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "valid WAD amount",
			input:    "1000000000000000000",
			expected: "1000000000000000000",
		},
		{
			name:     "zero amount",
			input:    "0",
			expected: "0",
		},
		{
			name:     "empty string",
			input:    "",
			expected: "0",
		},
		{
			name:     "invalid string",
			input:    "invalid",
			expected: "0",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			expected, _ := new(big.Int).SetString(tt.expected, 10)
			result := ParseAmount(tt.input, "test")
			if result.Cmp(expected) != 0 {
				t.Errorf("ParseAmount(%s) = %s, want %s", tt.input, result.String(), tt.expected)
			}
		})
	}
}

func TestWADConstant(t *testing.T) {
	expected := big.NewInt(1e18)
	if WAD.Cmp(expected) != 0 {
		t.Errorf("WAD constant = %s, want %s", WAD.String(), expected.String())
	}
}
