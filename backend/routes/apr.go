package endpoints

import (
	"encoding/json"
	"net/http"
	"volos-backend/service"
)

func APRHistoryHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	marketId := r.URL.Query().Get("marketId")
	if marketId == "" {
		http.Error(w, "marketId is required", http.StatusBadRequest)
		return
	}
	result, err := service.GetAPRHistory(marketId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(result)
}
