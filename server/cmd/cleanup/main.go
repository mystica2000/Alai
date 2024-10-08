package main

import (
	"fmt"
	"os"
	"path/filepath"
	projectpath "server/internal/projectPath"
)

func main() {
	// cleanup recordings, waveforms
	// db.json

	dataPath := filepath.Join(projectpath.Root, "internal/data")
	recordingsPath := filepath.Join(dataPath, "recordings")
	waveformsPath := filepath.Join(dataPath, "waveforms")
	dbPath := filepath.Join(dataPath, "db.json")

	fmt.Println("Starting Cleanup")

	// Cleanup db.json
	if err := os.WriteFile(dbPath, []byte(""), 0644); err != nil {
		fmt.Printf("Error emptying db.json: %v\n", err)
	} else {
		fmt.Println("Emptying db.json")
		fmt.Println("Cleanup successful - db.json")
	}

	// Cleanup recordings directory
	if err := os.RemoveAll(recordingsPath); err != nil {
		fmt.Printf("Error cleaning recordings/: %v\n", err)
	} else {
		if err := os.Mkdir(recordingsPath, 0755); err != nil {
			fmt.Printf("Error re-creating recordings/: %v\n", err)
		} else {
			fmt.Println("Emptying recordings/")
			fmt.Println("Cleanup successful - recordings/")
		}
	}

	// Cleanup waveforms directory
	if err := os.RemoveAll(waveformsPath); err != nil {
		fmt.Printf("Error cleaning waveforms/: %v\n", err)
	} else {
		if err := os.Mkdir(waveformsPath, 0755); err != nil {
			fmt.Printf("Error re-creating waveforms/: %v\n", err)
		} else {
			fmt.Println("Emptying waveforms/")
			fmt.Println("Cleanup successful - waveforms/")
		}
	}

	fmt.Println("Cleanup Process Completed")
}
