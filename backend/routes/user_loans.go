package routes

import (
	"encoding/json"
	"net/http"
	"volos-backend/services"
)

// Handler for GET /user-loans?caller=ADDRESS
func UserLoansHandler(w http.ResponseWriter, r *http.Request) {
	caller := r.URL.Query().Get("caller")
	if caller == "" {
		http.Error(w, "Missing 'caller' query parameter", http.StatusBadRequest)
		return
	}

	result, err := services.GetUserLoanHistory(caller)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}
