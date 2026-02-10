# AGENTS.md

## Star Citizen Community Hub

Full-stack logistics and community platform for Star Citizen organizations.

---

## Commands

### Backend (Python/FastAPI)

```bash
cd backend

# Development
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload              # Start dev server on :8000

# Database
alembic upgrade head                        # Run migrations
alembic revision --autogenerate -m "desc"   # Create migration
python -m app.tasks.seed                    # Seed initial data

# Testing
pytest                                      # Run all tests
pytest -v                                   # Verbose output
pytest tests/test_models_user.py            # Run single test file
pytest tests/test_models_user.py::test_create_user  # Run single test
pytest -k "test_create"                     # Run tests matching pattern
pytest --tb=short                           # Short traceback
pytest -x                                   # Stop on first failure

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend (Vue 3 + Vite)

```bash
cd frontend

# Setup
npm install

# Development
npm run dev                                 # Start dev server on :5173
npm run build                               # Production build
npm run preview                             # Preview production build
```

### Full Stack (Root)

```bash
./scripts/install.sh                        # Production install
./scripts/update.sh                         # Update deployment
./scripts/uninstall.sh                      # Remove installation
```

---

## Code Style Guidelines

### Python (Backend)

**Imports:**
```python
# 1. Standard library
from datetime import datetime, timedelta
from typing import Optional, Annotated

# 2. Third-party packages
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import String, select
from pydantic import BaseModel, Field

# 3. Local application
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse
```

**Naming Conventions:**
- Files: `snake_case.py`
- Classes: `PascalCase`
- Functions/Variables: `snake_case`
- Constants: `UPPER_SNAKE_CASE`
- Router instances: `{name}_router`

**SQLAlchemy 2.0 Style:**
```python
class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
```

**Pydantic Schemas:**
```python
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
```

**Error Handling:**
```python
raise HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Resource not found"
)
```

**Type Hints:** Always use type hints. Use `Optional[T]` for nullable, `Annotated[T, Depends()]` for FastAPI dependencies.

### Vue/JavaScript (Frontend)

**Component Structure:**
```vue
<template>
  <!-- Template content -->
</template>

<script setup>
// 1. Vue imports
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

// 2. Store imports
import { useAuthStore } from '../stores/auth';

// 3. Service/utility imports
import api from '../services/api';

// Reactive state
const email = ref('');
const isLoading = ref(false);

// Lifecycle
onMounted(() => { /* ... */ });

// Methods
const handleSubmit = async () => { /* ... */ };
</script>
```

**Naming Conventions:**
- Components: `PascalCase.vue`
- Stores: `camelCase.js` (e.g., `useAuthStore`)
- Views: `PascalCaseView.vue`
- Composables: `useCamelCase`

**Tailwind CSS Classes:**
- Use theme colors: `sc-dark`, `sc-panel`, `sc-blue`, `sc-light-blue`, `sc-grey`
- Group related classes together
- Use arbitrary values sparingly: `bg-black/70`

**API Calls:**
```javascript
import api from '../services/api';

const response = await api.get('/endpoint');
const data = response.data;
```

**Store Pattern (Pinia):**
```javascript
export const useStoreName = defineStore('storeName', {
  state: () => ({ /* ... */ }),
  getters: { /* ... */ },
  actions: {
    async actionName() {
      this.isLoading = true;
      try {
        // API call
      } catch (err) {
        this.error = err.response?.data?.detail || 'Error message';
        throw err;
      } finally {
        this.isLoading = false;
      }
    }
  }
});
```

**Available Stores:**
- `useAuthStore` - Authentication state
- `useActivityStore` - Activity feed data
- `useNotificationStore` - Notifications with polling
- `useAchievementStore` - Achievements and leaderboard
- `useMessageStore` - Direct messaging
- `useTradeStore` - Trading, prices, contracts
- `useCrewStore` - LFG, availability, loadouts

---

## Architecture Overview

**Backend Structure:**
- `app/models/` - SQLAlchemy models
- `app/schemas/` - Pydantic request/response schemas
- `app/routers/` - API route handlers (prefix: `/api/*`)
- `app/routers/*_web.py` - Template/HTML routes
- `app/services/` - Business logic
- `app/tasks/` - Background/async tasks
- `app/templates/` - Jinja2 templates
- `tests/` - pytest test files

**Frontend Structure:**
- `src/views/` - Page components
- `src/components/` - Reusable UI components
- `src/stores/` - Pinia state management
- `src/services/` - API service layer
- `src/router/` - Vue Router configuration

---

## Feature Implementation Guide

### Adding Activity Tracking
When implementing features that should appear in the Activity Feed:

```python
from app.services.activity import ActivityService
from app.models.activity import ActivityType

# In your service/endpoint:
activity_service = ActivityService(db)
await activity_service.track_ship_added(
    user_id=user.id,
    ship_id=ship.id,
    ship_name=ship.name,
    ship_type=ship.ship_type
)
```

### Adding Notifications
When implementing features that should send notifications:

```python
from app.services.notification import NotificationService

notification_service = NotificationService(db)
await notification_service.notify_op_invite(
    user_id=invited_user_id,
    invited_by_id=current_user.id,
    invited_by_name=current_user.display_name,
    operation_title=event.title,
    operation_id=event.id
)
```

### Adding Achievements
System achievements are auto-checked. To award custom achievements:

```python
from app.services.achievement import AchievementService

achievement_service = AchievementService(db)
await achievement_service.award_achievement(
    user_id=user_id,
    achievement_id=achievement_id,
    awarded_by_id=admin_id,
    award_note="For exceptional service"
)
```

### Discord Webhook Integration
To post to Discord when an event occurs:

```python
from app.services.discord import DiscordService

discord_service = DiscordService(db)
await discord_service.post_announcement(
    title="New Ship Acquired",
    content=f"{user.display_name} has added a {ship_type} to the fleet!",
    author_name=user.display_name
)
```

---

## Testing Notes

- Tests use async SQLite (`sqlite+aiosqlite:///./data/test.db`)
- `conftest.py` provides `db_session` fixture for database tests
- Use `@pytest.mark.asyncio` for async tests
- Test naming: `test_<module>_<functionality>`
