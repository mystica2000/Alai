package handlers

import (
	"encoding/json"
	"net/http"
	"server/internal/storage"
	"strconv"
	"strings"
)

func Recordings(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getRecordings(w, r)
	case http.MethodDelete:
		deleteRecordings(w, r)
	case http.MethodPut:
		updateRecordings(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func getRecordings(w http.ResponseWriter, _ *http.Request) {
	storage, err := storage.GetRecords()

	if err != nil {
		http.Error(w, "Could not GET", http.StatusInternalServerError)
		return
	}

	response := map[string][]byte{
		"recordings": storage,
	}

	w.Header().Set("Content-Type", "application/json")

	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode recordings to JSON", http.StatusInternalServerError)
		return
	}
}

func deleteRecordings(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(strings.TrimPrefix(r.URL.Path, "/recordings/"))

	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	storage.DeleteRecord(id)

	w.WriteHeader(http.StatusAccepted)
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte("Deleted Successfully"))
}

func updateRecordings(w http.ResponseWriter, r *http.Request) {

}
