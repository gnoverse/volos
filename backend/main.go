package main

import (
	"fmt"
	"net/http"
	"volos-backend/internal/endpoints"
)

func withCORS(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		handler(w, r)
	}
}

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "Hello from Volos backend!")
	})

	http.HandleFunc("/api/total-supply-history", withCORS(endpoints.TotalSupplyHistoryHandler))
	http.HandleFunc("/api/total-borrow-history", withCORS(endpoints.TotalBorrowHistoryHandler))
	http.HandleFunc("/api/total-utilization-history", withCORS(endpoints.TotalUtilizationHistoryHandler))
	http.HandleFunc("/api/market-activity", withCORS(endpoints.MarketActivityHandler))

	fmt.Println("Server running on http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}
