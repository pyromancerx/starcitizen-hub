# Star Citizen Community Hub

A self-hosted, full-stack logistics and community platform for Star Citizen organizations.

![License](https://img.shields.io/badge/license-MIT-blue)
![Go](https://img.shields.io/badge/go-1.24+-00ADD8)
![Next.js](https://img.shields.io/badge/next.js-15.x-black)

## Architecture

- **Backend:** Go 1.24+, SQLite (WAL Mode), GORM, gorilla/websocket
- **Frontend:** Next.js 15 (App Router), TailwindCSS (Sci-Fi Theme), React Query, Zustand
- **Infrastructure:** Caddy (Reverse Proxy & HTTPS), Systemd, WebRTC (Peer-to-Peer)

## Features

### 🚀 Asset Management
- **Fleet Registry:** Track organization and member ships with loadout details and real-time readiness status (Ready, Damaged, etc.).
- **Tactical Blueprints:** Design and share ship loadouts with real-time performance analytics (DPS, Shield HP, Power Draw).
- **Equip to Vessel:** One-click synchronization of tactical blueprints with your registered fleet.
- **Bulk Import:** Seamlessly import your entire RSI hangar using HangarXPLORER JSON exports or Erkul ship configurations.
- **Inventory Tracking:** Manage personal and shared items across the verse with automated scanning.
- **Financial Terminal:** Track aUEC balances and transactions securely within the organization.
- **Planetary Outposts:** Register and manage player-owned bases and outposts with coordinate tracking.

### 📦 Logistics
- **Org Stockpiles:** Shared resource management with transaction history and strategic asset loaning.
- **Project Management:** Organize strategic initiatives with phases, tasks, and completion tracking.
- **Crowdfunding:** Create contribution goals for projects (e.g., "Fund a Javelin") with automatic progress tracking.
- **Procurement Intelligence:** Automated analysis of organization stockpiles against mission requirements to identify logistical shortfalls.

### 📡 Communications
- **Sub-Space Social Hub:** Real-time WebRTC voice and video communication matrix with a centralized signaling layer.
- **Global Command Search:** Quickly find members, vessels, and active operations from the unified search bar.
- **Spectrum Forum:** Secure, hierarchical discussion boards for permanent organization records and tactical briefings.
- **Operations Console:** Advanced mission planning with mandatory ship/gear requirements and automated readiness HUDs.
- **Direct Messaging:** Private 1-on-1 messaging between members with real-time WebSocket delivery and presence.
- **Activity Feed:** Organization timeline showing member activities, achievements, and fleet additions.
- **Notification Center:** In-app HUD alerts for mentions, operation invites, and critical system updates.

### 🎮 Social & Engagement
- **Achievement System:** Gamification with auto-awarded and custom merit citations.
- **Service Records:** View comprehensive career stats on member profiles.
- **Crew Finder (LFG):** Post "Looking For Group" signals to find crewmates for ships and activities.

### 🌐 Integrations
- **Discord Integration:** Webhook relay for announcements and operations.
- **RSI Integration:** Star Citizen account verification and automatic roster synchronization.

### 📊 Trading & Economy
- **Cargo Contracts:** Member-to-member hauling jobs with automatic escrow.
- **Trade Run Tracker:** Log trade runs with auto-calculated profit tracking.

---

## 🛠️ Quick Start (Development)

### 1. Backend Setup
```bash
cd backend-go
# Build and Run
go build -o server ./cmd/server/main.go
./server
```

### 2. Frontend Setup
```bash
cd frontend-next
npm install
npm run dev
```
Access the app at `http://localhost:3000`.

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

### One-Line Installer
Run the following command as root to automatically install and configure the entire stack:

```bash
curl -sSL https://raw.githubusercontent.com/pyromancerx/starcitizen-hub/main/scripts/install.sh | sudo bash
```

### Prerequisites
- Debian 13 (Trixie) server
- Root access
- Domain name pointed to your server (A Record)

### 1. Installation & Setup
The automated installer will set up all dependencies (Go, Node.js, Caddy, Systemd), clone the repository to `/opt/starcitizen-hub`, and launch the configuration wizard.

```bash
# Optional: Manual installation from clone
sudo ./scripts/install.sh
```
*The script will prompt you for your domain name, security preferences, and admin credentials.*

### 2. Creating Additional Admins (CLI)
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

## 🎯 Achievement System



Gamification layer to recognize and reward member accomplishments via auto-awarded and custom merit citations.



---



## 📡 Federation Guide



Federation allows multiple Star Citizen Hub instances to peer with each other, enabling shared situational awareness across allied organizations.



### 🔗 Establishing a Link

To link two hubs (Instance A and Instance B):



1.  **Exchange URLs:** Determine the public `Instance URL` for both hubs.

2.  **Agree on a Secret:** Both organization admins must agree on a **Shared Secret Key**.

3.  **Add Peer:** Register the entity in the **Inter-Org Federation** console.



### 🛡️ Security Model

- **HMAC-SHA256:** All server-to-server requests are signed using the Shared Secret.

- **Timestamp Verification:** Requests include a timestamp to prevent replay attacks.



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
