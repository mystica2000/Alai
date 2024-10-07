package storage

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	projectpath "server/internal/projectPath"
	"sort"
	"strconv"
	"time"
)

type Record struct {
	ID        int           `json:"id"`
	Name      string        `json:"name" `
	Symlink   string        `json:"symlink"`
	CreatedAt unixTimestamp `json:"created_at"`
}

// TrimmedRecord struct excludes CreatedAt and Symlink
type TrimmedRecord struct {
	ID        int           `json:"id"`
	Name      string        `json:"name"`
	CreatedAt unixTimestamp `json:"created_at"`
}

type unixTimestamp time.Time

const dbName = "db.json"

type RecordSlice []Record

var records RecordSlice

func (ut unixTimestamp) MarshalJSON() ([]byte, error) {
	s := strconv.FormatInt(time.Time(ut).Unix(), 10)
	return []byte(s), nil
}

func (ut *unixTimestamp) UnmarshalJSON(dat []byte) error {
	unix, err := strconv.ParseInt(string(dat), 10, 64)
	if err != nil {
		return err
	}

	*ut = unixTimestamp(time.Unix(int64(unix), 0))
	return nil
}

func AddFileToDB(fileName string) {

	LoadDBFromDisk()

	newID := 1

	if len(records) > 1 {
		newID = records[len(records)-1].ID + 1
	}

	readableName := fmt.Sprintf("recording_%d", newID)
	newRecord := Record{
		ID:        newID,
		Name:      readableName,
		CreatedAt: unixTimestamp(time.Now()),
		Symlink:   fileName,
	}
	AppendRecord(newRecord)
}

func AppendRecord(record Record) {
	records = append(records, record)
	SaveToDB()
}

func DeleteRecord(id int) {
	recordingPath := filepath.Join(projectpath.Root, "internal/data/recordings/")

	for i, record := range records {
		if record.ID == id {
			recordingPath = filepath.Join(recordingPath, record.Symlink)

			if err := os.Remove(recordingPath); err != nil {
				log.Fatal(err)
			}

			records = append(records[:i], records[i+1:]...)
			SaveToDB()
			break
		}
	}
}

func UpdateRecord(rec Record) {
	for i, record := range records {
		if record.ID == rec.ID {
			records[i].Name = rec.Name
			SaveToDB()
			break
		}
	}
}

func SortRecords() {
	sort.Slice(records, func(i, j int) bool {
		return records[i].ID < records[j].ID
	})
	SaveToDB()
}

func SaveToDB() error {
	jsonData, err := json.MarshalIndent(records, "", "\t")
	if err != nil {
		return fmt.Errorf("error marshaling to JSON: %v", err)
	}

	dataPath := filepath.Join(projectpath.Root, "internal/data", dbName)
	err = os.WriteFile(dataPath, jsonData, 0644)
	if err != nil {
		return fmt.Errorf("error writing to file: %v", err)
	}

	return nil
}

func LoadDBFromDisk() error {

	dataPath := filepath.Join(projectpath.Root, "internal/data", dbName)
	jsonData, err := os.ReadFile(dataPath)

	if err != nil {
		if os.IsNotExist(err) {
			records = make(RecordSlice, 0)
			return nil
		}
		return fmt.Errorf("error reading from disk to JSON: %v", err)
	}

	// If the file is empty, initialize an empty records slice
	if len(jsonData) == 0 {
		records = make(RecordSlice, 0) // Empty slice
		return nil
	}

	err = json.Unmarshal(jsonData, &records)
	if err != nil {
		return fmt.Errorf("error unmarshalling json %v", err)
	}

	return nil
}

func GetRecords() ([]byte, error) {
	err := LoadDBFromDisk()
	if err != nil {
		return nil, err
	}

	// Create a new slice for trimmed records
	var trimmedRecords []TrimmedRecord

	// Map records to the new struct
	for _, record := range records {
		trimmedRecords = append(trimmedRecords, TrimmedRecord{
			ID:        record.ID,
			Name:      record.Name,
			CreatedAt: record.CreatedAt,
		})
	}

	if len(trimmedRecords) == 0 {
		return []byte{}, nil
	}

	// Convert the trimmed records to JSON
	jsonData, err := json.MarshalIndent(trimmedRecords, "", "\t")
	if err != nil {
		return nil, fmt.Errorf("error marshaling trimmed records to JSON: %v", err)
	}

	return jsonData, nil
}

func GetRecordFileNameByID(id int) (string, error) {
	err := LoadDBFromDisk()
	if err != nil {
		return "", err
	}

	fileName := ""

	for _, record := range records {
		if record.ID == id {
			fileName = record.Symlink
			break
		}
	}

	if fileName == "" {
		return "", fmt.Errorf("Not Found Record for %d", id)
	}

	return fileName, nil
}
