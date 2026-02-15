package main

import (
	"log"

	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/database"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/services"
)

func main() {
	log.Println("Initializing database connection...")
	database.Connect()

	s := services.NewGameDataService(database.DB)
	
	log.Println("Starting Game Data Synchronization...")
	if err := s.SyncFromCommunityData(); err != nil {
		log.Fatalf("Sync failed: %v", err)
	}
	
	log.Println("Synchronization complete.")
}
