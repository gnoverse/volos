package dbupdater

import (
	"testing"
)

func TestCalculateUtilizationRate(t *testing.T) {
	tests := []struct {
		name        string
		totalSupply string
		totalBorrow string
		expected    string
	}{
		{
			name:        "50% utilization",
			totalSupply: "2000000000000000000",
			totalBorrow: "1000000000000000000",
			expected:    "500000000000000000",
		},
		{
			name:        "100% utilization",
			totalSupply: "1000000000000000000",
			totalBorrow: "1000000000000000000",
			expected:    "1000000000000000000",
		},
		{
			name:        "25% utilization",
			totalSupply: "4000000000000000000",
			totalBorrow: "1000000000000000000",
			expected:    "250000000000000000",
		},
		{
			name:        "zero supply",
			totalSupply: "0",
			totalBorrow: "1000000000000000000",
			expected:    "0",
		},
		{
			name:        "zero borrow",
			totalSupply: "1000000000000000000",
			totalBorrow: "0",
			expected:    "0",
		},
		{
			name:        "small values",
			totalSupply: "1000000000000000",
			totalBorrow: "100000000000000",
			expected:    "100000000000000000",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := calculateUtilizationRate(tt.totalSupply, tt.totalBorrow)
			if result != tt.expected {
				t.Errorf("calculateUtilizationRate(%s, %s) = %s, want %s",
					tt.totalSupply, tt.totalBorrow, result, tt.expected)
			}
		})
	}
}
