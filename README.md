# Star Citizen Community Hub

A self-hosted, full-stack logistics and community platform for Star Citizen organizations.

![License](https://img.shields.io/badge/license-MIT-blue)
![Go](https://img.shields.io/badge/go-1.24+-00ADD8)
![Vue](https://img.shields.io/badge/vue-3.x-green)

## Architecture

- **Backend:** Go 1.24+, SQLite (WAL Mode), GORM
- **Frontend:** Vue 3, Vite, TailwindCSS (Sci-Fi Theme), Pinia
- **Infrastructure:** Caddy (Reverse Proxy & HTTPS), Systemd

## Features

### 🚀 Asset Management
- **Fleet Registry:** Track organization and member ships with loadout details and real-time readiness status (Ready, Damaged, etc.).
- **Bulk Import:** Seamlessly import your entire RSI hangar using HangarXPLORER JSON exports.
- **Inventory Tracking:** Manage personal and shared items across the verse.
- **Financial Terminal:** Track aUEC balances and transactions securely.

### 📦 Logistics
- **Org Stockpiles:** Shared resource management with transaction history.
- **Project Management:** Organize construction, mining, or combat operations with phases, tasks, and completion tracking.
- **Crowdfunding:** Create contribution goals for projects (e.g., "Fund a Javelin") with automatic progress tracking.

### 📡 Communications
- **Global Search:** Quickly find members, ships, projects, and forum threads from the universal search bar.
- **Spectrum Forum:** Secure, hierarchical discussion boards.
- **Operations Calendar:** Event scheduling with role-based signups and participant notifications.
- **Direct Messaging:** Private 1-on-1 messaging between members with real-time delivery.
- **Activity Feed:** Organization timeline showing member activities (imports, new ships, completed operations, trades, achievements).
- **Notification Center:** In-app notifications for mentions, operation invites, contract updates, and project contributions.
- **Federation:** Securely peer with allied organizations to share event data and trade requests via HMAC-signed APIs.

### 🎮 Social & Engagement
- **Achievement System:** Gamification with auto-awarded and custom achievements (Common, Rare, Epic, Legendary).
- **Service Records:** View comprehensive career stats on member profiles (lifetime profit, contributions, operations).
- **Crew Finder (LFG):** Post "Looking For Group" requests to find crewmates for ships and activities.
- **Availability Scheduler:** Weekly availability tracking to coordinate play sessions.
- **Crew Loadouts:** Save and deploy named crew configurations for multi-crew ships.

### 🌐 Integrations
- **Discord Integration:** OAuth login, automatic announcements to Discord channels, role synchronization.
- **RSI Integration:** Star Citizen account verification (manual approval with screenshot).

### 📊 Trading & Economy
- **Cargo Contracts:** Member-to-member hauling jobs with **automatic escrow** (funds are held securely and released upon delivery).
- **Trade Run Tracker:** Log trade runs with auto-calculated profit tracking.
- **Commodity Price Database:** Crowdsourced market data with best route calculations and price history.

---

## 🛠️ Quick Start (Development)

### 1. Backend Setup
```bash
cd backend-go
# Build and Run
go build -o server ./cmd/server/main.go
./server
# OR use standalone script from root: ./scripts/start_backend.sh
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Access the app at `http://localhost:5173`.

---

## 🚢 Bulk Fleet Import

You can quickly populate your fleet by importing data from your RSI Hangar.

1.  **Install HangarXPLORER:** Use the [HangarXPLORER](https://github.com/dolkensp/HangarXPLOR) browser extension on the RSI website.
2.  **Export JSON:** Navigate to your hangar on the RSI site and use the extension to export your hangar as a JSON file.
3.  **Import to Hub:**
    *   Navigate to **Fleet Registry** in the Hub.
    *   Click **Import RSI Hangar**.
    *   Select your exported `.json` file.
    *   Your ships and their insurance status will be automatically added.

---

## 💰 Financial Escrow

The Cargo Contract system uses a secure escrow mechanism to protect both parties.

1.  **Posting a Contract:** When you post a contract, the payment amount is immediately deducted from your wallet and held by the system.
2.  **Acceptance:** A hauler accepts the contract.
3.  **Completion:** Once the cargo is delivered and the contract is marked as **Completed**, the system automatically releases the held funds to the hauler's wallet.
4.  **Cancellation:** If a contract is cancelled, the escrowed funds are automatically refunded to the poster's wallet.

---

## 🔍 Search & Discovery

The Hub features a global search bar in the header (on desktop) that scans multiple databases simultaneously:
- **Members:** Search by display name, RSI handle, or email.
- **Vessels:** Find specific ships by name or ship type across the organization.
- **Projects:** Locate active logistics or combat operations.
- **Spectrum:** Search forum thread titles for discussions.

---

## 🚀 Production Deployment (Debian 13)

### Prerequisites
- Debian 13 (Trixie) server
- Root access
- Domain name pointed to your server (A Record)

### 1. Installation
Run the automated installer to set up dependencies (Go, Node.js, Caddy, Systemd).

```bash
# Clone the repository
git clone https://github.com/pyromancerx/starcitizen-hub.git
cd starcitizen-hub

# Run the installer (as root)
sudo ./scripts/install.sh
```

### 2. Configuration & Setup
This script configures the environment, builds the frontend, and generates the Caddyfile. **It will also prompt you to create the initial admin user.**

```bash
sudo ./scripts/setup.sh
```
*Follow the prompts to set your domain name, security preferences, and admin credentials.*

### 3. Creating Additional Admins (CLI)
If you need to create an admin user manually from the command line:

```bash
cd /opt/starcitizen-hub/backend-go
./server -create-admin -email "admin@example.com" -password "your-secure-password" -name "Commander" -handle "MyHandle"
```

### 4. Accessing the Hub
Navigate to `https://your-domain.com`. Log in with the admin credentials created above.

---

## 👥 User Management

### Adding Users
1.  **Registration:** Users can register an account at `https://your-domain.com/login`.
2.  **Approval:** By default, new accounts require approval.
    *   Log in as an Admin.
    *   Navigate to the **System Admin** tab.
    *   Review the **Personnel** list and update the user status to **Approved**.

### CLI Management
You can create additional admin users directly from the server terminal:

```bash
cd /opt/starcitizen-hub/backend-go
./server -create-admin -email pilot@example.com -password "secure-pass" -name "Pilot" -handle "PilotHandle"
```

---

## 🎯 Activity Feed

The Activity Feed provides a real-time timeline of organization activities, creating community engagement and awareness.

### Features
- **Activity Types:** Tracks member joins, member approvals, fleet imports, ship additions, trade completions, contract updates (posted/completed), project updates, LFG posts, and price reports.
- **Real-time Updates:** Automatic updates via polling.
- **Reactions:** Emoji reactions (👍, ❤️, 🎉, etc.) on activities.
- **Filtering:** Filter by activity type or view all.
- **Dashboard Widget:** Integrated into the main dashboard.

### API Endpoints
- `GET /api/activity/feed` - Get paginated activity feed
- `GET /api/activity/recent` - Get recent activities (last N hours)
- `POST /api/activity/{id}/react` - Add reaction to activity
- `DELETE /api/activity/{id}/react/{emoji}` - Remove reaction

---

## 🔔 Notification System

In-app notification center for alerts, mentions, and updates.

### Notification Types
- **Mentions:** When someone @mentions you in forum posts or comments.
- **Operation Invites:** Invitations to operations/events.
- **Operation Reminders:** Alerts when operations are starting soon.
- **Contract Updates:** Contract accepted, completed, or cancelled notifications.
- **LFG Responses:** When someone responds to your crew-finding post.
- **Achievement Unlocks:** New achievement earned.
- **Approval Requests:** Admin notifications for pending member approvals.

### Features
- **Unread Count Badge:** Shows on notification bell and Messages nav item.
- **Notification Preferences:** Enable/disable specific notification types.
- **Mark All as Read:** One-click clearing.
- **Mobile Responsive:** Dropdown notifications in header.

### API Endpoints
- `GET /api/notifications/` - Get notifications list
- `GET /api/notifications/unread-count` - Get unread count
- `POST /api/notifications/mark-read` - Mark as read
- `PUT /api/notifications/preferences/me` - Update preferences

---

## 🏆 Achievement System

Gamification layer to recognize and reward member accomplishments.

### Achievement Types
- **System Achievements:** Auto-awarded based on tracked activities:
  - *First Steps* (1 trade run) - Common, 10 pts
  - *Trader* (10 trade runs) - Common, 25 pts
  - *Merchant Prince* (50 trade runs) - Rare, 100 pts
  - *Fleet Admiral* (5 ships) - Rare, 50 pts
  - *Reliable Hauler* (5 contracts) - Common, 25 pts
  - *Operation Veteran* (10 operations) - Common, 25 pts
  - *Community Voice* (20 forum posts) - Common, 25 pts
  - *Founding Member* (30 days) - Epic, 75 pts
  - *Legend* (365 days) - Legendary, 500 pts

- **Custom Achievements:** Created and manually awarded by admins.

### Rarity Levels
- **Common** (10-25 points)
- **Rare** (50-100 points)
- **Epic** (75-150 points)
- **Legendary** (500 points)

### Features
- **Achievement Center:** View earned and available achievements.
- **Leaderboard:** Top achievers by total points.
- **Rarity Breakdown:** Visual breakdown of achievement rarities earned.
- **Unlock Notifications:** Celebrate new achievements with modal popup.

### API Endpoints
- `GET /api/achievements/` - List all achievements
- `GET /api/achievements/my/achievements` - Get my achievements
- `GET /api/achievements/my/summary` - Get achievement summary
- `POST /api/achievements/check` - Check for new achievements
- `POST /api/achievements/award` - Admin: manually award achievement
- `POST /api/achievements/setup/defaults` - Admin: create default achievements

---

## 💬 Direct Messaging

Private 1-on-1 messaging system for member communication.

### Features
- **Conversations:** Persistent message threads with last message preview.
- **Real-time:** Polling every 10 seconds for new messages.
- **Read Receipts:** Shows when messages are read.
- **Soft Delete:** Delete conversations (removed from your view only).
- **Unread Counts:** Badge on navigation showing unread messages.
- **Compose:** Start new conversations from member list.

### UI
- **Split Pane:** Conversation list on left, message thread on right.
- **Bubble Style:** Different colors for sent vs received messages.
- **Responsive:** Works on desktop and mobile.

### API Endpoints
- `GET /api/messages/conversations` - Get conversation list
- `GET /api/messages/conversations/{id}` - Get conversation with messages
- `POST /api/messages/send` - Send message
- `POST /api/messages/conversations/{id}/read` - Mark as read
- `GET /api/messages/unread-count` - Get unread count
- `DELETE /api/messages/conversations/{id}` - Delete conversation

---

## 🎮 Discord Integration

Connect your Star Citizen Hub with Discord for seamless community management.

### Features

#### 1. OAuth Login
- Users can link Discord accounts to their hub profile.
- Automatic Discord guild/server joining.
- Profile sync (username, avatar).

#### 2. Webhook Announcements
Configure webhooks to auto-post to Discord channels:
- **Announcements** - New organization announcements
- **Events** - Operation scheduling and updates
- **Trades** - Trade completions (opt-in privacy)
- **Achievements** - Member achievement unlocks
- **Contracts** - New cargo contracts posted

Each post includes rich Discord embeds with appropriate colors.

#### 3. Role Synchronization
- Map hub roles to Discord roles.
- Automatic role assignment when linking accounts.
- Manual sync option for existing users.
- Admin bulk sync capability.

### Setup Instructions

1. **Create Discord Application:**
   - Go to https://discord.com/developers/applications
   - Create New Application
   - Go to OAuth2 → Add Redirect URL: `https://your-domain.com/api/discord/callback`
   - Copy Client ID and Client Secret

2. **Create Bot:**
   - Go to Bot tab → Add Bot
   - Enable "Server Members Intent"
   - Copy Bot Token
   - Invite bot to your server with permissions: Manage Roles, Send Messages

3. **Configure Webhooks:**
   - In Discord, go to Channel Settings → Integrations → Webhooks
   - Create webhook for each channel you want to post to
   - Copy webhook URLs

4. **Hub Configuration:**
   - Log in as admin
   - Go to **System Admin** → **Discord Integration**
   - Enter OAuth Client ID, Client Secret, Bot Token
   - Configure webhook URLs
   - Toggle auto-post settings
   - Set up role mappings

### API Endpoints
- `GET/POST /api/discord/settings` - Manage integration settings (admin)
- `GET/POST /api/discord/webhooks` - Manage webhooks (admin)
- `GET /api/discord/login-url` - Get Discord OAuth URL
- `POST /api/discord/callback` - OAuth callback handler
- `GET/DELETE /api/discord/my-link` - View/unlink Discord account
- `GET/POST /api/discord/role-mappings` - Manage role mappings (admin)
- `POST /api/discord/sync-my-roles` - Sync my Discord roles

---

## ✓ RSI Integration

Verify Star Citizen accounts to prove identity and display verified RSI handles on profiles.

### Features

#### 1. Account Verification
- Users submit their RSI handle with a screenshot proof.
- Admins review and approve/reject verification requests.
- Verified users get a badge and link to their RSI profile.
- Prevents impersonation and builds trust within the organization.

#### 2. Verification Workflow
1. **User Submits:** Provides RSI handle and screenshot URL
2. **Admin Review:** Screenshot is checked for validity
3. **Approval:** Handle is linked to user profile with verified badge
4. **Rejection:** User is notified with reason (optional)

#### 3. Profile Display
- Verified RSI handle shown on member profiles
- Direct link to RSI profile page
- Visual verification badge

### Verification Instructions for Users

1. Go to your RSI profile: https://robertsspaceindustries.com/account/profile
2. Take a screenshot showing your handle clearly
3. Upload to an image host (Imgur, Discord, etc.)
4. Submit via Profile → RSI Verification
5. Wait for admin approval

### Admin Review Process

1. Go to **Command** → **RSI Verification**
2. Review pending requests
3. Check screenshot for:
   - Handle matches submission
   - Screenshot is clear and valid
   - Profile appears legitimate
4. Approve or reject with notes

### API Endpoints
- `POST /api/rsi/verify` - Submit verification request
- `GET /api/rsi/status` - Get my verification status
- `GET /api/rsi/profile/{user_id}` - Get user's RSI profile
- `GET /api/rsi/admin/pending` - Get pending requests (admin)
- `POST /api/rsi/admin/review/{request_id}` - Review request (admin)

---

## 📡 Federation Guide

Federation allows multiple Star Citizen Hub instances to peer with each other, enabling shared situational awareness and logistics across allied organizations.

### 🔗 Establishing a Link
To link two hubs (Instance A and Instance B):

1.  **Exchange URLs:** Determine the public `Instance URL` for both hubs (e.g., `https://hub.org-a.com` and `https://hub.org-b.com`).
2.  **Agree on a Secret:** Both organization admins must agree on a **Shared Secret Key** (a long, random string).
3.  **Add Peer on Instance A:**
    *   Go to **Logistics** -> **Federation**.
    *   Click **Establish Link**.
    *   Enter Instance B's name, URL, and the Shared Secret.
4.  **Add Peer on Instance B:**
    *   Repeat the process entering Instance A's details and the **same** Shared Secret.

### 🛡️ Security Model
- **HMAC-SHA256:** All server-to-server requests are signed using the Shared Secret.
- **Timestamp Verification:** Requests include a timestamp to prevent replay attacks.
- **Source Validation:** The `X-Hub-Source-Host` header is verified against the registered peer database.

### 📊 Shared Data
Once linked, the hubs will automatically perform the following:
- **Event Sync:** Public operations and events from the peer will appear in your **Cross-Instance Intelligence** feed.
- **Trade Requests:** Organizations can broadcast resource needs (e.g., "Buying Quantainium") which become visible to verified peers.

---

## 🔄 Maintenance

### Managing the Backend (Standalone)
If you are not using systemd (e.g., in development), use the following scripts:

```bash
# Start backend in background
./scripts/start_backend.sh

# Stop backend gracefully
./scripts/stop_backend.sh
```

### Updating the Hub
To pull the latest changes, rebuild the frontend, and run migrations:

```bash
sudo /opt/starcitizen-hub/scripts/update.sh
```

### Uninstalling
To completely remove the application and service:

```bash
sudo /opt/starcitizen-hub/scripts/uninstall.sh
```
*You will be prompted to back up your database before deletion.*

---

## 📚 API Documentation

The backend provides auto-generated API docs (available only to authenticated users or if configured):
- **Swagger UI:** `https://your-domain.com/api/docs`
- **ReDoc:** `https://your-domain.com/api/redoc`