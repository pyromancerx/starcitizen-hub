# Star Citizen Hub - Feature Roadmap Design

**Date:** 2026-02-08
**Status:** Approved

## Overview

This document outlines the complete feature set for the Star Citizen Hub, a self-hosted community platform for Star Citizen organizations. The hub serves four primary use cases:

1. Org management and coordination
2. Trading community tools
3. Multi-crew session planning
4. Social features and communication

## Technical Approach

**Frontend Stack:**
- Server-rendered templates (Jinja2)
- HTMX for reactive UI without full page reloads
- Tailwind CSS for styling
- Mobile-responsive design

**Backend Stack (existing):**
- FastAPI (Python)
- SQLAlchemy with SQLite
- JWT authentication
- Alembic migrations

---

## Phase 1: Core Infrastructure

### 1.1 Frontend Foundation

Build the template system and base layout.

**Components:**
- Base layout with navigation, auth state, flash messages
- Login/register pages
- Responsive sidebar navigation
- HTMX integration for partial page updates
- Toast notifications for user feedback

**Pages:**
- Landing page (public)
- Login / Register
- Dashboard (authenticated home)

### 1.2 Admin Panel

Administrative interface for org leaders.

**User Management:**
- List all users with search/filter
- Approve pending registrations
- Ban/unban users
- Assign/remove roles

**Role Editor:**
- Create custom roles
- Define permissions per role
- Set role hierarchy and sort order

**Instance Settings:**
- Toggle registration (open/closed)
- Toggle approval requirement
- Set instance name and branding
- Configure notification defaults

**Audit Log:**
- Track admin actions (who did what, when)
- Filterable by action type, user, date range

### 1.3 User Dashboard

Personal hub for each member.

**Profile Management:**
- Edit display name, avatar, RSI handle
- Change password
- Notification preferences
- Data export / account deletion

**Overview Cards:**
- Fleet summary (ship count, total value)
- Wallet balance
- Upcoming operations
- Recent activity

**Quick Actions:**
- Add ship
- Transfer funds
- View stockpiles

---

## Phase 2: Org Management

### 2.1 Fleet Operations Planner

Coordinate group activities.

**Operation Model:**
```
Operation:
  - id, title, description
  - type (mining, cargo, combat, exploration, social)
  - scheduled_at, estimated_duration
  - status (planning, recruiting, active, completed, cancelled)
  - created_by (user)
  - max_participants
  - requirements (text/markdown)
```

**Features:**
- Create/edit operations with rich details
- Set required roles and ship types
- Member sign-up with ship selection
- Waitlist when full
- Operation chat/notes thread
- Post-op summary with completion status
- Payout distribution from org treasury

**Views:**
- Calendar view (month/week)
- List view with filters
- Operation detail page
- My operations (signed up / created)

### 2.2 Member Directory

Browse and search org members.

**Features:**
- Searchable member list
- Filter by role, ship type, online status
- "Online now" indicator (last seen < 15 min)
- Member profile pages

**Profile Display:**
- Avatar, display name, RSI handle (linked)
- Roles and join date
- Fleet listing
- Operation history
- Achievement badges

### 2.3 Role & Permission System

Granular access control.

**Permissions:**
```
- admin.manage_users
- admin.manage_roles
- admin.manage_settings
- admin.view_audit_log
- org.manage_treasury
- org.manage_stockpiles
- org.create_operations
- org.manage_operations (edit others')
- org.post_announcements
- members.approve
- members.view_directory
- trading.create_contracts
- trading.manage_prices
```

**Features:**
- Permissions stored as JSON array on Role
- Check permissions via dependency injection
- UI shows/hides features based on permissions
- Permission inheritance by tier (admin > officer > member > recruit)

### 2.4 Org Treasury

Manage organization finances.

**Features:**
- Separate org wallet (not tied to a user)
- Deposit/withdraw with approval workflow
- Transaction categories (op payout, stockpile purchase, donation)
- Income/expense reports
- Monthly/weekly summaries
- Budget tracking (optional)

---

## Phase 3: Trading & Cargo

### 3.1 Trade Run Tracker

Log and analyze trading activity.

**Trade Run Model:**
```
TradeRun:
  - id, user_id
  - origin_location, destination_location
  - commodity, quantity (SCU)
  - buy_price, sell_price
  - profit (calculated)
  - ship_id (optional)
  - completed_at
  - notes
```

**Features:**
- Quick-add form for logging runs
- Auto-calculate profit
- Personal trade history
- Statistics: total profit, average per run, best commodity
- Leaderboards (opt-in)

### 3.2 Commodity Price Database

Crowdsourced market data.

**Price Report Model:**
```
PriceReport:
  - id, user_id
  - location, commodity
  - buy_price, sell_price
  - reported_at
```

**Features:**
- Submit price reports
- View latest prices by location
- Price history graphs (simple line chart)
- Data freshness indicators (green < 1 day, yellow < 3 days, red > 3 days)
- Best routes calculator (highest profit margin)

### 3.3 Cargo Contracts

Member-to-member hauling jobs.

**Contract Model:**
```
CargoContract:
  - id, poster_id, hauler_id
  - origin, destination
  - commodity, quantity
  - payment_amount
  - deadline
  - status (open, accepted, in_progress, completed, cancelled, disputed)
  - created_at, completed_at
```

**Features:**
- Post contracts with requirements
- Browse open contracts
- Accept contract (locks it)
- Mark complete (triggers payment from escrow)
- Dispute resolution (admin review)
- Hauler reputation score

---

## Phase 4: Multi-Crew Coordination

### 4.1 Crew Finder (LFG)

Find crewmates for ships.

**LFG Post Model:**
```
LFGPost:
  - id, user_id
  - ship_type, activity_type
  - looking_for_roles (pilot, turret, engineer, etc.)
  - scheduled_time (optional)
  - duration_estimate
  - notes
  - status (open, filled, expired)
  - created_at
```

**Features:**
- Post "looking for crew" requests
- Browse available posts
- Filter by ship, activity, time
- One-click respond
- Auto-expire old posts

### 4.2 Availability & Session Scheduler

Plan play sessions.

**Availability Model:**
```
UserAvailability:
  - user_id
  - day_of_week
  - start_time, end_time
  - timezone
```

**Features:**
- Weekly availability grid
- View overlapping availability with friends/org
- Suggest session times based on overlap
- Session creation from availability matches
- Calendar integration (iCal export)

### 4.3 Crew Loadouts

Save ship crew configurations.

**Loadout Model:**
```
CrewLoadout:
  - id, name, ship_id
  - created_by
  - positions: [{role: "pilot", user_id: 1}, ...]
```

**Features:**
- Create named loadouts for multi-crew ships
- Assign members to positions
- Quick-deploy for regular crews
- Find substitutes when someone unavailable

---

## Phase 5: Social Features

### 5.1 Activity Feed

Organization timeline.

**Activity Model:**
```
Activity:
  - id, type, user_id
  - content (JSON)
  - created_at
```

**Activity Types:**
- member_joined, member_approved
- operation_created, operation_completed
- achievement_earned
- announcement_posted
- ship_added
- trade_completed (opt-in)

**Features:**
- Paginated feed on dashboard
- Filter by activity type
- HTMX polling for updates (every 30s)
- React to activities (simple emoji reactions)

### 5.2 Announcements

Official org communications.

**Announcement Model:**
```
Announcement:
  - id, author_id
  - title, content (markdown)
  - priority (normal, important, critical)
  - pinned (boolean)
  - published_at, expires_at
```

**Features:**
- Create/edit announcements (permission required)
- Pin to dashboard
- Priority styling (critical = red banner)
- Read tracking
- Optional Discord webhook

### 5.3 Discussion Boards

Simple forum system.

**Models:**
```
ForumCategory:
  - id, name, description, sort_order

ForumThread:
  - id, category_id, author_id
  - title, pinned, locked
  - created_at, last_reply_at

ForumPost:
  - id, thread_id, author_id
  - content (markdown)
  - created_at, edited_at
```

**Features:**
- Categories (General, Operations, Trading, etc.)
- Create threads, reply to threads
- Markdown support
- Pin/lock threads (moderators)
- @mentions with notifications
- Subscribe to threads

### 5.4 Direct Messaging

Private member communication.

**Message Model:**
```
DirectMessage:
  - id, sender_id, recipient_id
  - content, read_at
  - created_at
```

**Features:**
- Send messages to members
- Inbox with conversations view
- Unread count in nav
- Mark read/delete

### 5.5 Achievement System

Gamification and recognition.

**Models:**
```
Achievement:
  - id, name, description
  - icon, rarity (common, rare, epic, legendary)
  - criteria (JSON - for auto-award)
  - created_by (null = system)

UserAchievement:
  - user_id, achievement_id
  - awarded_at, awarded_by
```

**Features:**
- System achievements (auto-awarded on criteria)
- Custom achievements (admin-created, manually awarded)
- Display on profiles
- Achievement unlock notifications
- Leaderboard by achievement points

---

## Phase 6: Notifications & Integrations

### 6.1 Notification System

In-app notification center.

**Notification Model:**
```
Notification:
  - id, user_id
  - type, title, message
  - link (optional)
  - read_at
  - created_at
```

**Notification Types:**
- op_invite, op_reminder, op_cancelled
- message_received
- mention
- approval_required, user_approved
- achievement_unlocked
- contract_accepted, contract_completed

**Features:**
- Bell icon with unread count
- Dropdown list of recent notifications
- Full notifications page
- Mark read / mark all read
- Notification preferences (enable/disable per type)

### 6.2 Discord Integration

Connect with Discord servers.

**Features:**
- Discord OAuth login (optional)
- Webhook configuration for channels
- Auto-post: announcements, op reminders, new members
- Role sync (map hub roles to Discord roles)

### 6.3 RSI Integration

Verify Star Citizen accounts.

**Features:**
- RSI handle verification (manual approval with screenshot)
- Link to RSI profile
- Display org affiliation
- Future: RSI API integration if available

### 6.4 Data Export & Privacy

GDPR compliance and data portability.

**Features:**
- Export personal data (JSON/CSV)
- Full account deletion
- Org data export for admins
- Privacy settings (hide from leaderboards, etc.)

---

## Implementation Priority

Suggested build order:

1. **Phase 1: Infrastructure** - Required foundation
2. **Phase 2.2 + 2.3: Member Directory & Roles** - Core org features
3. **Phase 2.1: Operations Planner** - Key coordination tool
4. **Phase 5.1 + 5.2: Activity Feed & Announcements** - Engagement
5. **Phase 4.1: Crew Finder** - Quick wins for multi-crew
6. **Phase 3.1: Trade Tracker** - Trading community
7. **Phase 6.1: Notifications** - Polish
8. **Remaining phases** - Based on user feedback

---

## Open Questions

1. **Email notifications** - Include email or rely on Discord webhooks?
2. **Real-time chat** - Add WebSocket chat or keep Discord as chat solution?
3. **Mobile app** - PWA support sufficient or native app later?
4. **Multi-org support** - Single org per instance or support multiple orgs?

---

## Next Steps

1. Set up frontend infrastructure (Jinja2 + HTMX + Tailwind)
2. Build admin panel
3. Build user dashboard
4. Iterate through phases based on priority
