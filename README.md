# Star Citizen Community Hub

A self-hosted social and logistics hub for Star Citizen communities.

## Features

- **User Management**: Registration, authentication, role-based access
- **Ship Registry**: Track your fleet with insurance expiry alerts
- **Personal Inventory**: Manage items across locations
- **Wallet System**: aUEC tracking with transfers between members
- **Org Stockpiles**: Shared resource management with transaction history

## Quick Start (Development)

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Production Deployment (Debian 13)

### Prerequisites

- Debian 13 (Trixie) server
- Root access
- Domain name pointed to your server

### Installation

1. Clone the repository to your server:
   ```bash
   git clone <repo-url> /tmp/starcitizen-hub
   cd /tmp/starcitizen-hub
   ```

2. Run the installation script:
   ```bash
   sudo ./scripts/install.sh
   ```

3. Run the setup script and follow the prompts:
   ```bash
   sudo ./scripts/setup.sh
   ```

   The setup script will ask for:
   - Your fully qualified domain name (e.g., `hub.example.com`)
   - Instance name
   - Registration and approval settings

4. Access your hub at `https://your-domain.com`

### What Gets Installed

- Python 3.12+ with virtual environment
- Caddy web server (automatic HTTPS via Let's Encrypt)
- Systemd service for the application
- SQLite database in `/opt/starcitizen-hub/data/`

### Configuration

Configuration is stored in `/opt/starcitizen-hub/.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | SQLite |
| `SECRET_KEY` | JWT signing key | Auto-generated |
| `INSTANCE_NAME` | Your hub's display name | Star Citizen Hub |
| `ALLOW_REGISTRATION` | Enable public signup | true |
| `REQUIRE_APPROVAL` | Require admin approval | true |

### Useful Commands

```bash
# View application logs
journalctl -u starcitizen-hub -f

# Restart the application
systemctl restart starcitizen-hub

# Check service status
systemctl status starcitizen-hub

# View Caddy logs
journalctl -u caddy -f
```

### Uninstalling

```bash
sudo ./scripts/uninstall.sh
```

## API Documentation

Once running, access the API documentation at:
- Swagger UI: `https://your-domain.com/docs`
- ReDoc: `https://your-domain.com/redoc`
