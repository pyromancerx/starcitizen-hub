package database

import (
	"log"
	"os"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect() {
	var err error
	dbPath := os.Getenv("DATABASE_URL")
	if dbPath == "" {
		dbPath = "hub.db" // Default
	}

	newLogger := logger.New(
		log.New(os.Stdout, "
", log.LstdFlags),
		logger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  logger.Info,
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)

	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: newLogger,
	})

	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Enable WAL mode for better concurrency
	DB.Exec("PRAGMA journal_mode=WAL;")
	log.Println("Database connection established")
}
