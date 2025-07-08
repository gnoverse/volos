package main

import (
	"fmt"
	"net/http"
	"volos-backend/internal/endpoints"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "Hello from Volos backend!")
	})

	http.HandleFunc("/api/total-supply-history", endpoints.TotalSupplyHistoryHandler)
	http.HandleFunc("/api/total-borrow-history", endpoints.TotalBorrowHistoryHandler)
	http.HandleFunc("/api/total-utilization-history", endpoints.TotalUtilizationHistoryHandler)

	fmt.Println("Server running on http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}
