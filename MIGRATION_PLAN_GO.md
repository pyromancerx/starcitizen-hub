# Star Citizen Hub - Backend Rewrite Plan (Python -> Go)

## Objective
Replace the unstable Python/SQLAlchemy backend with a robust, statically typed Go (Golang) service while maintaining 100% API compatibility with the existing Vue.js frontend.

## Technology Stack
- **Language:** Go 1.23+
- **Web Framework:** [Chi](https://github.com/go-chi/chi) (Lightweight, idiomatic, standard net/http compatible)
- **Database ORM:** [GORM](https://gorm.io/) (Feature-rich, reduces boilerplate for complex relationships)
- **Database Driver:** SQLite (with `CGO_ENABLED=1` for performance/WAL mode)
- **Authentication:** `golang-jwt/jwt`
- **Configuration:** `joho/godotenv`
- **Validation:** `go-playground/validator`

## Directory Structure (Standard Go Layout)
```text
backend-go/
├── cmd/
│   └── server/
│       └── main.go          # Entry point
├── internal/
│   ├── config/              # Env var loading
│   ├── database/            # GORM connection & setup
│   ├── models/              # Structs (User, Ship, etc.)
│   ├── handlers/            # HTTP Controllers (parse req, call service, send res)
│   ├── services/            # Business Logic
│   ├── middleware/          # Auth, CORS, Logging
│   └── utils/               # Helpers (Hashing, etc.)
├── migrations/              # SQL or GORM auto-migration logic
├── go.mod
└── go.sum
```

## Migration Phases

### Phase 1: Foundation & Auth (Critical Path)
**Goal:** Get the server running, connecting to DB, and handling login/registration.
1.  Initialize Go module.
2.  Setup Database connection (GORM + SQLite).
3.  Implement `User`, `Role`, `UserRole` models.
4.  Implement `AuthService` (Password hashing, JWT generation).
5.  Implement Auth Endpoints: `/api/auth/login`, `/api/auth/register`, `/api/auth/me`.
6.  Setup Middleware: `AuthMiddleware`, `CORSMiddleware`.

### Phase 2: Asset Management & Economy
**Goal:** Port ship registry and financial systems.
1.  **Models:** `Ship`, `Wallet`, `WalletTransaction`, `PersonalInventory`.
2.  **Endpoints:**
    -   `/api/ships` (CRUD, Import HangarXPLORER)
    -   `/api/wallet` (Balance, Transactions)
    -   `/api/inventory`

### Phase 3: Organization Logistics
**Goal:** Port logistics and operations.
1.  **Models:** `OrgStockpile`, `Operation`, `Project`, `TradeRun`, `CargoContract`.
2.  **Endpoints:**
    -   `/api/stockpiles`
    -   `/api/operations` & `/api/events`
    -   `/api/projects`
    -   `/api/trade` (Routes, Contracts, Escrow logic)

### Phase 4: Social & Communication
**Goal:** Port forums, messages, and notifications.
1.  **Models:** `Forum`, `Thread`, `Post`, `Message`, `Conversation`, `Notification`, `Activity`.
2.  **Endpoints:**
    -   `/api/forum`
    -   `/api/messages`
    -   `/api/notifications`
    -   `/api/activity`

### Phase 5: Integrations & Admin
**Goal:** Port external integrations and admin tools.
1.  **Models:** `DiscordConfig`, `RSIRequest`.
2.  **Endpoints:**
    -   `/api/discord`
    -   `/api/rsi`
    -   `/api/admin` (User management, Settings)
    -   `/api/stats` & `/api/search`

## Execution Strategy
We will create a new directory `backend-go` to work in parallel without destroying the existing (albeit broken) Python backend reference. Once `backend-go` is functional for Phase 1, we can switch the start scripts.

## Database Strategy
- We will reuse the `hub.db` SQLite file concept.
- We will rely on GORM's `AutoMigrate` for the initial rapid development to replicate the schema, or write raw SQL migrations if precise control is needed to match the existing schema exactly.

