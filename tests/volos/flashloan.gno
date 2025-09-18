package main

import (
	volos "gno.land/r/volos/mocks"
)

func main() {
	// Test flash loan with GNS token
	volos.FlashLoan(cross, "gno.land/r/gnoswap/gns", 10000, "gno.land/r/gnoswap/gns")
} 