package aggregator

import (
	"math/big"
	"testing"

	"volos-backend/services/utils"
)

// MockFirestoreClient is a simple mock for testing
type MockFirestoreClient struct {
	// Add mock data as needed for testing
}

func TestCalculateAveragesFromSnapshots(t *testing.T) {
	ma := &MarketAggregator{}

	tests := []struct {
		name      string
		snapshots []MarketSnapshot
		expected  *MarketAverages
	}{
		{
			name: "single snapshot",
			snapshots: []MarketSnapshot{
				{
					SupplyAPR:             "1000000000000000000", // 1 WAD (100%)
					BorrowAPR:             "2000000000000000000", // 2 WAD (200%)
					UtilizationRate:       "500000000000000000",  // 0.5 WAD (50%)
					TotalSupply:           "1000000000000000000",
					TotalBorrow:           "500000000000000000",
					TotalCollateralSupply: "2000000000000000000",
				},
			},
			expected: &MarketAverages{
				SupplyAPR:             "1000000000000000000",
				BorrowAPR:             "2000000000000000000",
				UtilizationRate:       "500000000000000000",
				TotalSupply:           "1000000000000000000",
				TotalBorrow:           "500000000000000000",
				TotalCollateralSupply: "2000000000000000000",
			},
		},
		{
			name: "multiple snapshots - averaging",
			snapshots: []MarketSnapshot{
				{
					SupplyAPR:             "1000000000000000000", // 1 WAD
					BorrowAPR:             "2000000000000000000", // 2 WAD
					UtilizationRate:       "500000000000000000",  // 0.5 WAD
					TotalSupply:           "1000000000000000000",
					TotalBorrow:           "500000000000000000",
					TotalCollateralSupply: "2000000000000000000",
				},
				{
					SupplyAPR:             "3000000000000000000", // 3 WAD
					BorrowAPR:             "4000000000000000000", // 4 WAD
					UtilizationRate:       "700000000000000000",  // 0.7 WAD
					TotalSupply:           "2000000000000000000",
					TotalBorrow:           "1000000000000000000",
					TotalCollateralSupply: "3000000000000000000",
				},
			},
			expected: &MarketAverages{
				SupplyAPR:             "2000000000000000000", // (1+3)/2 = 2 WAD
				BorrowAPR:             "3000000000000000000", // (2+4)/2 = 3 WAD
				UtilizationRate:       "600000000000000000",  // (0.5+0.7)/2 = 0.6 WAD
				TotalSupply:           "1500000000000000000", // (1+2)/2 = 1.5 WAD
				TotalBorrow:           "750000000000000000",  // (0.5+1)/2 = 0.75 WAD
				TotalCollateralSupply: "2500000000000000000", // (2+3)/2 = 2.5 WAD
			},
		},
		{
			name:      "empty snapshots",
			snapshots: []MarketSnapshot{},
			expected:  nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := ma.calculateAveragesFromSnapshots(tt.snapshots)
			if err != nil {
				t.Fatalf("calculateAveragesFromSnapshots() error = %v", err)
			}

			if tt.expected == nil {
				if result != nil {
					t.Errorf("calculateAveragesFromSnapshots() = %v, want nil", result)
				}
				return
			}

			if result == nil {
				t.Fatalf("calculateAveragesFromSnapshots() = nil, want %v", tt.expected)
			}

			// Compare each field
			if result.SupplyAPR != tt.expected.SupplyAPR {
				t.Errorf("SupplyAPR = %s, want %s", result.SupplyAPR, tt.expected.SupplyAPR)
			}
			if result.BorrowAPR != tt.expected.BorrowAPR {
				t.Errorf("BorrowAPR = %s, want %s", result.BorrowAPR, tt.expected.BorrowAPR)
			}
			if result.UtilizationRate != tt.expected.UtilizationRate {
				t.Errorf("UtilizationRate = %s, want %s", result.UtilizationRate, tt.expected.UtilizationRate)
			}
			if result.TotalSupply != tt.expected.TotalSupply {
				t.Errorf("TotalSupply = %s, want %s", result.TotalSupply, tt.expected.TotalSupply)
			}
			if result.TotalBorrow != tt.expected.TotalBorrow {
				t.Errorf("TotalBorrow = %s, want %s", result.TotalBorrow, tt.expected.TotalBorrow)
			}
			if result.TotalCollateralSupply != tt.expected.TotalCollateralSupply {
				t.Errorf("TotalCollateralSupply = %s, want %s", result.TotalCollateralSupply, tt.expected.TotalCollateralSupply)
			}
		})
	}
}

func TestWADMathIntegration(t *testing.T) {
	// Test that our WAD math functions work correctly for typical APR values
	tests := []struct {
		name     string
		values   []string
		expected string
	}{
		{
			name:     "average of 5% and 10% APR",
			values:   []string{"50000000000000000", "100000000000000000"}, // 5% and 10% in WAD
			expected: "75000000000000000",                                 // 7.5% in WAD
		},
		{
			name:     "average of 0.1% and 0.2% APR",
			values:   []string{"1000000000000000", "2000000000000000"}, // 0.1% and 0.2% in WAD
			expected: "1500000000000000",                               // 0.15% in WAD
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var total *big.Int = big.NewInt(0)
			for _, value := range tt.values {
				val := utils.ParseAmount(value, "test")
				total.Add(total, val)
			}

			count := big.NewInt(int64(len(tt.values)))
			result := new(big.Int).Div(total, count)

			expected, _ := new(big.Int).SetString(tt.expected, 10)
			if result.Cmp(expected) != 0 {
				t.Errorf("big.Int.Div(%s, %s) = %s, want %s", total.String(), count.String(), result.String(), tt.expected)
			}
		})
	}
}
