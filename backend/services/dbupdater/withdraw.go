package dbupdater

import (
	"log"
)

// ProcessWithdraw handles Withdraw events and updates the Firestore database accordingly.
// This function will be called from the transaction processor when a Withdraw event is detected.
func ProcessWithdraw(tx map[string]interface{}) {
	log.Println("Processing Withdraw event")

	// todo
}
