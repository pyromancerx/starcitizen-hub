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
- **Federation:** Securely peer with allied organizations to share event data and trade requests via HMAC-signed APIs.

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