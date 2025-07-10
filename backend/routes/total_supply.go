package routes

import (
	"encoding/json"
	"net/http"
	"volos-backend/services"
)

func TotalSupplyHistoryHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	marketId := r.URL.Query().Get("marketId")
	if marketId == "" {
		http.Error(w, "marketId is required", http.StatusBadRequest)
		return
	}
	result, err := services.GetTotalSupplyHistory(marketId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(result)
}
