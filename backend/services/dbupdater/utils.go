package dbupdater

import (
	"log/slog"
	"math/big"
	"time"
	
	"cloud.google.com/go/firestore"
)

// AddAmounts adds two u256 amounts and returns the result as a string.
// If amount1 is invalid, treats it as "0".
func AddAmounts(amount1 string, amount2 *big.Int) string {
	current := new(big.Int)
	if _, ok := current.SetString(amount1, 10); !ok {
		slog.Warn("invalid amount string, treating as 0", "amount", amount1)
		current.SetInt64(0)
	}
	result := new(big.Int).Add(current, amount2)
	return result.String()
}

// SubtractAmounts subtracts amount2 from amount1 and returns the result as a string.
// If the result would be negative, returns "0".
// If amount1 is invalid, treats it as "0".
func SubtractAmounts(amount1 string, amount2 *big.Int) string {
	current := new(big.Int)
	if _, ok := current.SetString(amount1, 10); !ok {
		slog.Warn("invalid amount string, treating as 0", "amount", amount1)
		current.SetInt64(0)
	}
	result := new(big.Int).Sub(current, amount2)
	if result.Sign() < 0 {
		result.SetInt64(0)
	}
	return result.String()
}

// GetAmountFromDoc extracts a u256 amount from a Firestore document field.
// Returns "0" if the field doesn't exist or is invalid.
func GetAmountFromDoc(doc *firestore.DocumentSnapshot, fieldName string) string {
	if doc == nil || !doc.Exists() {
		return "0"
	}
	
	if s, err := doc.DataAt(fieldName); err == nil {
		if sStr, ok := s.(string); ok {
			// Validate that it's a valid big.Int
			if _, ok := new(big.Int).SetString(sStr, 10); ok {
				return sStr
			}
		}
	}
	
	slog.Warn("invalid or missing amount field", "field", fieldName)
	return "0"
}

// UpdateAmountInDoc updates a u256 amount in a Firestore document field.
// This is a helper for the common pattern of reading current amount, applying operation, and updating.
func UpdateAmountInDoc(currentAmount string, delta *big.Int, isAddition bool) string {
	if isAddition {
		return AddAmounts(currentAmount, delta)
	}
	return SubtractAmounts(currentAmount, delta)
}

// GetTimeFromDoc extracts a time.Time from a Firestore document field.
// Returns zero time if the field doesn't exist or is invalid.
func GetTimeFromDoc(doc *firestore.DocumentSnapshot, fieldName string) time.Time {
	if doc == nil || !doc.Exists() {
		return time.Time{}
	}
	
	if v, err := doc.DataAt(fieldName); err == nil {
		if t, ok := v.(time.Time); ok {
			return t
		}
	}
	
	slog.Warn("invalid or missing time field", "field", fieldName)
	return time.Time{}
}
