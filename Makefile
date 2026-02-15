.PHONY: sync-data build-backend start-backend

sync-data:
	@echo "Syncing game data from scunpacked..."
	cd backend-go && go run cmd/sync_data/main.go

build-backend:
	cd backend-go && go build -o server cmd/server/main.go

start-backend:
	./scripts/start_backend_go.sh
