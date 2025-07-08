package main

import (
	"fmt"
	"volos-backend/internal/endpoints"
	"net/http"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "Hello from Volos backend!")
	})

	http.HandleFunc("/api/total-supply-history", endpoints.TotalSupplyHistoryHandler)

	fmt.Println("Server running on http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}
