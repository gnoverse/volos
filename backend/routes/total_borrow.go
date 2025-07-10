package routes

import (
	"encoding/json"
	"net/http"
	"volos-backend/services"
)

func TotalBorrowHistoryHandler(w http.ResponseWriter, r *http.Request) {
	marketId := r.URL.Query().Get("marketId")
	if marketId == "" {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error": "marketId is required"}`))
		return
	}
	result, err := services.GetTotalBorrowHistory(marketId)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error": "` + err.Error() + `"}`))
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}
