package main

import (
	"log"
	"server/internal/config"
	"server/internal/server"
)

func main() {
	cfg, err := config.Load()

	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	s := server.New(cfg)
	if err := s.Start(); err != nil {
		log.Fatalf("Server error: %v", err)
	}

}
