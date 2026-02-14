# Developer Guide (Go/Next.js)

## Star Citizen Community Hub

Full-stack logistics and community platform for Star Citizen organizations.

---

## Commands

### Backend (Go)

```bash
cd backend-go

# Development
go run ./cmd/server/main.go                  # Start dev server on :8000

# Build
go build -o server ./cmd/server/main.go

# Database Management
# Migrations are run automatically on startup.
# To create an admin via CLI:
./server -create-admin -email "admin@example.com" -password "pass" -name "Name" -handle "Handle"
```

### Frontend (Next.js 15)

```bash
cd frontend-next

# Setup
npm install

# Development
npm run dev                                 # Start dev server on :3000

# Build
npm run build                               # Production build
```

### Deployment

```bash
./scripts/package.sh                        # Create release tarball
./scripts/update.sh                         # Update existing deployment
```

---

## Code Style Guidelines

### Go (Backend)

**Project Structure:**
- `cmd/server/main.go` - Entry point and route definitions.
- `internal/handlers/` - HTTP request parsing and response sending.
- `internal/services/` - Business logic and database operations.
- `internal/models/` - GORM struct definitions.
- `internal/middleware/` - Auth, CORS, and rate limiting.

**Naming:**
- Use `PascalCase` for exported symbols (functions, types, fields).
- Use `camelCase` for internal variables and unexported symbols.

**GORM Usage:**
- Preload associations explicitly: `db.Preload("User").Find(&items)`.
- Use transactions for multi-step updates: `db.Transaction(func(tx *gorm.DB) error { ... })`.

### Next.js/TypeScript (Frontend)

**Component Structure:**
- Functional components with `use client` directive where hooks are used.
- Use `lucide-react` for icons.
- Use `tailwind-merge` (`cn` utility) for dynamic classes.

**State Management:**
- **Zustand:** For global state (auth, theme).
- **React Query:** For server state (fetching, mutations, caching).

**API Interaction:**
- Use the shared `api` axios instance in `@/lib/api`.
- Signaling: Use `useSignaling` hook for the global WebSocket link.

---

## Feature Implementation Guide

### Adding Activity Tracking
```go
// In your handler/service:
h.db.Create(&models.Activity{
    Type: "ACTION_TYPE",
    UserID: &userID,
    Content: "performed a specific action",
    CreatedAt: time.Now(),
})
```

### Establishing Real-time Signaling
```typescript
const { send, subscribe } = useSignaling();

// To send:
send({ type: 'my-event', data: { ... } });

// To receive:
useEffect(() => {
    const unsub = subscribe((msg) => {
        if (msg.type === 'my-event') { ... }
    });
    return unsub;
}, [subscribe]);
```

### Discord Relay
```go
// Inject DiscordService and call Relay functions
h.discordService.RelayAnnouncement(announcement)
```
