# Star Citizen Community Hub

A self-hosted, full-stack logistics and community platform for Star Citizen organizations.

![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.12+-yellow)
![Vue](https://img.shields.io/badge/vue-3.x-green)

## Architecture

- **Backend:** FastAPI (Python), SQLite (WAL Mode), SQLAlchemy 2.0
- **Frontend:** Vue 3, Vite, TailwindCSS (Sci-Fi Theme), Pinia
- **Infrastructure:** Caddy (Reverse Proxy & HTTPS), Systemd

## Features

### 🚀 Asset Management
- **Fleet Registry:** Track organization and member ships with loadout details.
- **Inventory Tracking:** Manage personal and shared items across the verse.
- **Financial Terminal:** Track aUEC balances and transactions securely.

### 📦 Logistics
- **Org Stockpiles:** Shared resource management with transaction history.
- **Project Management:** Organize construction, mining, or combat operations with phases and tasks.
- **Crowdfunding:** Create contribution goals for projects (e.g., "Fund a Javelin").

### 📡 Communications
- **Spectrum Forum:** Secure, hierarchical discussion boards.
- **Operations Calendar:** Event scheduling with role-based signups.
- **Direct Messaging:** Private 1-on-1 messaging between members with real-time delivery.
- **Activity Feed:** Organization timeline showing member activities (new ships, completed operations, trades, achievements).
- **Notification Center:** In-app notifications for mentions, operation invites, contract updates, and achievements.
- **Federation:** Securely peer with allied organizations to share event data and trade requests via HMAC-signed APIs.

### 🎮 Social & Engagement
- **Achievement System:** Gamification with auto-awarded and custom achievements (Common, Rare, Epic, Legendary).
- **Crew Finder (LFG):** Post "Looking For Group" requests to find crewmates for ships and activities.
- **Availability Scheduler:** Weekly availability tracking to coordinate play sessions with overlapping schedules.
- **Crew Loadouts:** Save and deploy named crew configurations for multi-crew ships.

### 🌐 Integrations
- **Discord Integration:** OAuth login, automatic announcements to Discord channels, role synchronization between hub and Discord server.
- **RSI Integration:** Star Citizen account verification (handle verification with screenshot approval).

### 📊 Trading & Economy
- **Trade Run Tracker:** Log trade runs with auto-calculated profit tracking.
- **Commodity Price Database:** Crowdsourced market data with best route calculations.
- **Cargo Contracts:** Member-to-member hauling jobs with escrow and reputation tracking.

---

## 🛠️ Quick Start (Development)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Run Migrations & Seed
alembic upgrade head
python -m app.tasks.seed
# Start Server
uvicorn app.main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Access the app at `http://localhost:5173`.

---

## 🚀 Production Deployment (Debian 13)

### Prerequisites
- Debian 13 (Trixie) server
- Root access
- Domain name pointed to your server (A Record)

### 1. Installation
Run the automated installer to set up dependencies (Python, Node.js, Caddy, Systemd).

```bash
# Clone the repository
git clone https://github.com/pyromancerx/starcitizen-hub.git
cd starcitizen-hub

# Run the installer (as root)
sudo ./scripts/install.sh
```

### 2. Configuration & Setup
This script configures the environment, builds the frontend, and generates the Caddyfile.

```bash
sudo ./scripts/setup.sh
```
*Follow the prompts to set your domain name and security preferences.*

### 3. Creating the First Admin
After installation, you need to create an initial administrator account to access the system.

```bash
cd /opt/starcitizen-hub/backend
sudo -u starcitizen-hub ../venv/bin/python -m app.cli create-admin admin@example.com MyHandle --name "Commander"
# You will be prompted to enter a password securely
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
    *   Review the "Pending Approval" list and click **Authorize**.

### CLI Management
You can also manage users directly from the server terminal:

```bash
# Approve a user by email
sudo -u starcitizen-hub /opt/starcitizen-hub/venv/bin/python -m app.cli approve-user pilot@example.com
```

---

## 🎯 Activity Feed

The Activity Feed provides a real-time timeline of organization activities, creating community engagement and awareness.

### Features
- **Activity Types:** Tracks member joins, operations, ship additions, trade completions, contract updates, LFG posts, and price reports.
- **Real-time Updates:** HTMX polling every 30 seconds for live updates.
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