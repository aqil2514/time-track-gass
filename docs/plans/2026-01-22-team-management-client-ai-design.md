# Team Management & Client-Side AI Design

**Date:** 2026-01-22
**Status:** Draft

## Overview

Redesign sistem dari individual user menjadi organization-based team management, dengan perpindahan AI screenshot analysis ke desktop app.

### Key Changes
1. Organization structure dengan roles (Owner, Admin, Member)
2. Owner create member accounts (bukan invite system)
3. AI screenshot analysis dipindah ke desktop app
4. Backend hanya terima activity metadata (tanpa screenshot)
5. Summary generation tetap di backend

---

## Design Decisions

| Aspect | Decision |
|--------|----------|
| Structure | Organization → Members (tanpa division layer) |
| Roles | Owner, Admin, Member |
| API Key Storage | Encrypted di backend, desktop fetch saat perlu |
| Screenshot Analysis | Desktop app (client-side) |
| Summary Generation | Backend (server-side) |
| Screenshot Storage | Tidak ada - metadata only |
| Member Creation | Owner set password, member bisa ganti optional |
| Management UI | Web dashboard (Owner/Admin), Desktop (Member capture + view own) |

---

## Data Model

### Organizations (New)
```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    owner_id UUID,                       -- nullable initially, set after user created
    timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',  -- owner configurable
    ai_api_key_encrypted TEXT,           -- encrypted GLM API key
    ai_api_key_iv TEXT,                  -- IV for decryption
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_owner ON organizations (owner_id);
```

### Users (Modified)
```sql
-- Add columns to existing users table
ALTER TABLE users ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'member';
-- role: 'owner', 'admin', 'member'

-- Email is UNIQUE globally: 1 email = 1 organization only
-- User cannot belong to multiple organizations

CREATE INDEX idx_users_organization ON users (organization_id);
```

### Registration Flow (Circular FK Solution)
```
1. BEGIN TRANSACTION
2. INSERT organization (owner_id = NULL) → get org_id
3. INSERT user (organization_id = org_id, role = 'owner') → get user_id
4. UPDATE organization SET owner_id = user_id
5. COMMIT
```

### Flow
1. User register → create organization → user becomes owner (see above)
2. Owner/Admin create member → insert user with org_id and role='member'
3. Member login → get org context → can fetch API key for desktop

### Constraints
- **1 email = 1 organization**: User cannot join multiple orgs
- Email globally unique across all organizations

---

## Backend API

### New Endpoints

#### Organization Management (Owner/Admin only)
```
POST   /org/members           -- create member
       Body: { email, password, name, role }
       Response: { id, email, name, role, created_at }

GET    /org/members           -- list all members
       Response: { data: [{ id, email, name, role, created_at }] }

PATCH  /org/members/:id       -- update member
       Body: { name?, role? }

DELETE /org/members/:id       -- remove member from org

GET    /org                   -- get organization info
       Response: { id, name, has_api_key, member_count, created_at }
```

#### API Key Management (Owner only)
```
PUT    /org/settings/api-key     -- set/update AI API key
       Body: { api_key }
       Response: { success: true }

DELETE /org/settings/api-key     -- remove API key
```

#### Organization Settings (Owner only)
```
PATCH  /org/settings             -- update org settings
       Body: { name?, timezone? }
       Response: { id, name, timezone, has_api_key, ... }
```

#### Password Management (All authenticated users)
```
PATCH  /auth/password            -- change own password
       Body: { old_password, new_password }
       Response: { success: true }
```

#### For Desktop App (authenticated member)
```
GET    /org/api-key              -- fetch decrypted API key
       Response: { api_key }
       Note: Returns 404 if not configured
```

### Modified Endpoints

#### Activity Upload (simplified)
```
POST /activity/upload
Body: {
    "app_name": "VS Code",
    "window_title": "main.go - timetrack",
    "category": "coding",
    "summary": "Editing Go handler for retry logic",
    "captured_at": "2026-01-22T10:00:00Z"
}

Response: {
    "success": true,
    "data": {
        "id": "uuid",
        "app_name": "VS Code",
        "window_title": "main.go - timetrack",
        "category": "coding",
        "summary": "Editing Go handler for retry logic",
        "captured_at": "2026-01-22T10:00:00Z"
    }
}
```

**Removed fields:**
- `image` - no longer sent to backend

### Permission Matrix

| Endpoint | Owner | Admin | Member |
|----------|-------|-------|--------|
| GET /org | Yes | Yes | Yes |
| POST /org/members | Yes | Yes | No |
| PATCH /org/members/:id | Yes | Yes | No |
| DELETE /org/members/:id | Yes | Yes* | No |
| PUT /org/settings/api-key | Yes | No | No |
| GET /org/api-key | Yes | Yes | Yes |
| GET /activity (own) | Yes | Yes | Yes |
| GET /activity (all members) | Yes | Yes | No |

*Admin cannot remove Owner or other Admins

---

## Backend Changes

### Remove
- `ai_service.go`: `AnalyzeScreenshotWithRetry()` method
- `ai_service.go`: `analyzeScreenshotWithModel()` method
- `retry_queue.go`: entire file (no longer needed)
- `retry_handler.go`: entire file
- Activity upload image processing logic
- `retry_queue` table (migration)

### Modify
- `ai_service.go`: Keep `GenerateSessionSummary()`, `GenerateDailySummary()`
- `ai_service.go`: Get API key from organization instead of config
- `activity_service.go`: Remove image handling, accept metadata only
- `auth_service.go`: Add organization context to user
- `auth_middleware.go`: Include org_id and role in context

### Add
- `organization_service.go`: CRUD for org and members
- `organization_handler.go`: HTTP handlers
- `crypto.go`: API key encryption/decryption utilities
- New migration for organizations table and users modifications

---

## Desktop App Changes

### New Features
1. **AI Service Module** - call GLM API directly
2. **API Key Caching** - fetch from backend, cache locally (memory/secure storage)
3. **Offline Queue Update** - queue metadata instead of images
4. **AI Failure Notification** - notify admin/owner when AI analysis fails

### Modified Flow
```
Current:
  Capture → Upload (image + metadata) → Backend analyzes → Store

New:
  Capture → Analyze locally (call GLM) → Upload (metadata only) → Store
         ↓ (on failure)
         → Queue for retry + Notify admin/owner
```

### AI Failure Handling
When desktop AI analysis fails (network error, API key invalid, quota exceeded):

```
1. Retry up to 3 times with exponential backoff
2. If still fails:
   a. Save to local retry queue (metadata + screenshot path)
   b. Upload activity with placeholder summary: "AI analysis pending"
   c. Send failure notification to backend
   d. Retry queue processed when connection restored
3. Notification payload:
   POST /org/notifications
   Body: {
     type: "ai_failure",
     member_id: "uuid",
     member_name: "Budi",
     error: "API quota exceeded",
     timestamp: "2026-01-22T10:00:00Z"
   }
```

### Notification Delivery (Backend)
```
- Store in notifications table
- Admin/Owner see notification badge in web dashboard
- Optional: email notification (future enhancement)
```

### API Key Flow
```
1. App start / Login
2. GET /org/api-key
3. Cache in memory (or secure storage)
4. Use for screenshot analysis
5. Refresh on 401 or periodic
```

### API Key Security Mitigations
1. **Rate limiting**: Backend tracks API usage per member
2. **Usage monitoring**: Dashboard shows API calls per member
3. **Key rotation**: Owner can rotate key, all desktops re-fetch on next call
4. **Anomaly detection**: Alert if single member uses excessive API calls

### New Components
- `src/lib/ai.ts` - AI service for screenshot analysis
- `src/lib/aiRetryQueue.ts` - local retry queue for failed analysis
- `src/hooks/useApiKey.ts` - fetch and cache API key
- `src/hooks/useNotification.ts` - send failure notifications
- Modify `useCapture.ts` - integrate local AI analysis with retry

---

## Desktop: Member View Own Data

Member dapat melihat activity sendiri di desktop app:
- Activity timeline (sudah ada)
- Daily stats
- Personal summary (generated locally atau fetch dari backend)

---

## Reporting & Analytics

### Access Matrix

| Report | Owner | Admin | Member |
|--------|-------|-------|--------|
| Own activity timeline | Yes | Yes | Yes |
| Own stats & summary | Yes | Yes | Yes |
| Team overview (aggregated) | Yes | Yes | No |
| Member list + summary | Yes | Yes | No |
| Member detail (activity timeline) | Yes | Yes | No |
| Member active hours | Yes | Yes | No |

### Member View (Desktop & Web)
- Activity timeline sendiri
- Daily/weekly stats sendiri
- Category breakdown sendiri

### Admin/Owner View (Web Dashboard)

#### 1. Team Overview (Aggregated)
```
Organization: PT Contoh
Date: 22 Jan 2026

Total Team Hours: 21 jam
Average per Member: 7 jam

Category Breakdown:
├── Coding      45%  ████████████████
├── Research    25%  █████████
├── Meeting     15%  █████
└── Other       15%  █████
```

#### 2. Member List + Summary
```
Members (3)                          Today
─────────────────────────────────────────
Budi     [Admin]                     8.5 jam
Ani      [Member]                    7.0 jam
Deni     [Member]                    5.5 jam
```
- Klik member → masuk ke detail

#### 3. Member Detail
- Activity timeline (seperti view member sendiri)
- Stats per member
- Active hours visualization

#### 4. Active Hours Heatmap
```
Organization: PT Contoh
Team Activity - 22 Jan 2026

           08 09 10 11 12 13 14 15 16 17 18
Budi       ██ ██ ██ ██    ██ ██ ██ ██ ██ ██
Ani        ██ ██ ██ ██ ██ ██ ██ ██ ██
Deni          ██ ██ ██       ██ ██ ██

Legend: ██ = Active (has activity in that hour)
```

Features:
- Organization name sebagai header
- Rows = members
- Columns = jam (configurable range, default 08-18)
- Intensity bisa based on activity count per jam
- Filter by date/date range
- Summary stats di bawah

### Backend Endpoints for Reporting

```
GET /org/stats
    Query: { from, to }
    Response: {
        total_hours: 21,
        avg_hours_per_member: 7,
        by_category: { coding: 45, research: 25, ... },
        member_count: 3
    }

GET /org/members/summary
    Query: { from, to }
    Response: {
        data: [
            { id, name, role, total_hours: 8.5, active_from: "09:00", active_to: "18:00" },
            ...
        ]
    }

GET /org/members/:id/activities
    Query: { from, to, page, per_page }
    Response: { data: [...activities], meta: {...} }

GET /org/members/:id/stats
    Query: { from, to }
    Response: { total_hours, by_category, ... }

GET /org/activity-heatmap
    Query: { date }
    Response: {
        date: "2026-01-22",
        members: [
            { id, name, hours: { "08": 2, "09": 5, "10": 3, ... } },
            ...
        ]
    }
```

---

## Web Dashboard Scope

### Owner/Admin Features
- Organization settings
- Member management (CRUD)
- API key configuration
- **Team overview (aggregated stats)**
- **Member list with summary**
- **Activity heatmap**
- **View member detail activities**

### Member Features (jika akses web)
- View own activities
- Change own password
- Personal stats

---

## Migration Plan

### Phase 1: Database
1. Create organizations table
2. Add columns to users table
3. Migrate existing users → each becomes org owner

### Phase 2: Backend
1. Add organization endpoints
2. Add API key encryption
3. Modify activity upload (accept both old & new format temporarily)
4. Add permission middleware

### Phase 3: Desktop
1. Add AI service module
2. Modify capture flow
3. Add API key fetching
4. Update upload to metadata-only

### Phase 4: Cleanup
1. Remove old image upload support
2. Remove backend AI screenshot analysis
3. Remove retry queue

---

## Security Considerations

1. **API Key Encryption**: Use AES-256-GCM for storing API keys
2. **API Key Transit**: HTTPS only, short-lived in memory on desktop
3. **Role Enforcement**: Backend validates role on every request
4. **Member Isolation**: Members can only access own data
5. **Password Hashing**: bcrypt (already implemented)

---

## Open Questions

1. ~~Bagaimana handle existing users tanpa organization?~~ → Auto-create org on first login/migration
2. ~~1 email = 1 org atau multi-org?~~ → 1 email = 1 org only
3. ~~Timezone handling~~ → Owner set timezone di org settings
4. ~~Daily summary trigger~~ → Scheduled job at midnight org timezone
5. ~~AI failure handling~~ → Notify admin/owner
6. Rate limiting untuk API key fetch endpoint?
7. Audit log untuk member management actions?
8. Maximum members per organization?
9. Organization deletion flow?
10. Owner transfer mechanism?

---

## Scheduled Jobs

### Daily Summary Generation
```
Trigger: Midnight based on organization timezone

Flow:
1. Scheduler checks all orgs, finds those where local time = 00:00
2. For each org:
   a. Fetch all activities from previous day (org timezone)
   b. Call AI GenerateDailySummary (using org's API key)
   c. Store summary in daily_summaries table
   d. If AI fails, mark as "failed" and notify owner
```

### Data Model Addition
```sql
CREATE TABLE daily_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    summary_date DATE NOT NULL,
    overview TEXT,
    top_categories JSONB,
    total_hours DECIMAL(5,2),
    highlights JSONB,
    status VARCHAR(20) DEFAULT 'success',  -- 'success', 'failed', 'pending'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, summary_date)
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    type VARCHAR(50) NOT NULL,           -- 'ai_failure', 'member_added', etc.
    title VARCHAR(200),
    message TEXT,
    metadata JSONB,                       -- { member_id, error, etc. }
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_org ON notifications (organization_id, is_read, created_at DESC);
```

### Notification Endpoints
```
GET    /org/notifications         -- list notifications (Admin/Owner)
       Query: { unread_only?, limit? }

PATCH  /org/notifications/:id     -- mark as read
       Body: { is_read: true }

POST   /org/notifications         -- create notification (internal/desktop)
       Body: { type, title, message, metadata }
```

---

## Next Steps

1. [ ] Finalize design (user approval)
2. [ ] Create detailed implementation plan
3. [ ] Database migration
4. [ ] Backend implementation
5. [ ] Desktop app changes
6. [ ] Testing
7. [ ] Documentation update
