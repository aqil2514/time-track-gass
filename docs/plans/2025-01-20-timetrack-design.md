# TimeTrack - Design Document

**Date:** 2025-01-20
**Status:** Draft

---

## 1. Overview

Personal time tracking app dengan screenshot analysis menggunakan AI (GLM 4.6V). Cross-platform desktop app dengan kemampuan share activity ke supervisor.

---

## 2. Tech Stack

| Component | Technology |
|-----------|------------|
| Desktop App | Tauri + React + shadcn |
| Backend API | Go + Gin |
| Web Dashboard | React + shadcn |
| Database | PostgreSQL + TimescaleDB |
| AI Analysis | Z.AI API (GLM 4.6V) |

---

## 3. Architecture

```
┌──────────────────┐         ┌──────────────────────────────┐
│   Desktop App    │         │        Go Backend (Gin)      │
│  Tauri + React   │────────▶│                              │
│  + shadcn        │         │  /api/auth     (login/reg)   │
│                  │         │  /api/activity (upload)      │
│  - Screenshot    │         │  /api/report   (get data)    │
│  - View report   │         │  /api/share    (permissions) │
└──────────────────┘         │                              │
                             │         ┌──────────┐         │
┌──────────────────┐         │         │ Z.AI API │         │
│  Web Dashboard   │────────▶│         │ (proxy)  │         │
│  React + shadcn  │         │         └──────────┘         │
│                  │         │                              │
│  - View report   │         │         ┌──────────┐         │
│  - Supervisor    │         │         │PostgreSQL│         │
└──────────────────┘         │         │+Timescale│         │
                             │         └──────────┘         │
                             └──────────────────────────────┘
```

### Flow
1. Desktop screenshot setiap 5 menit (configurable)
2. Kirim ke Go backend
3. Backend proxy ke Z.AI API → dapat summary
4. Simpan hasil ke PostgreSQL (TimescaleDB hypertable)
5. Desktop & Web bisa lihat report
6. Supervisor bisa lihat activity user yang share

---

## 4. Database Schema (TimescaleDB)

```sql
-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Users
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Activities (hypertable)
CREATE TABLE activities (
    id              UUID DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    captured_at     TIMESTAMPTZ NOT NULL,
    app_name        VARCHAR(100),
    window_title    VARCHAR(500),
    category        VARCHAR(50),
    summary         VARCHAR(500),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_hypertable('activities', 'captured_at',
    chunk_time_interval => INTERVAL '1 week'
);

-- Enable compression
ALTER TABLE activities SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'user_id',
    timescaledb.compress_orderby = 'captured_at DESC'
);

SELECT add_compression_policy('activities', INTERVAL '1 month');
SELECT add_retention_policy('activities', INTERVAL '1 year');

-- Shares
CREATE TABLE shares (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID NOT NULL REFERENCES users(id),
    viewer_id       UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_id, viewer_id)
);

-- Shared Links (Public/Secret)
CREATE TABLE shared_links (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    slug            VARCHAR(50) UNIQUE NOT NULL, -- Random string
    name            VARCHAR(100), -- e.g. "Link for Boss"
    expires_at      TIMESTAMPTZ,
    is_public       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    views           INT DEFAULT 0
);

-- Sessions
CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    token           VARCHAR(255) UNIQUE NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL
);

-- Indexes
CREATE INDEX idx_activities_user ON activities (user_id, captured_at DESC);
CREATE INDEX idx_activities_category ON activities (user_id, category);
CREATE INDEX idx_shares_owner ON shares (owner_id);
CREATE INDEX idx_shares_viewer ON shares (viewer_id);
CREATE INDEX idx_sessions_expires ON sessions (expires_at);

-- Continuous Aggregates
CREATE MATERIALIZED VIEW daily_summary
WITH (timescaledb.continuous) AS
SELECT
    user_id,
    time_bucket('1 day', captured_at) AS day,
    category,
    COUNT(*) as activity_count,
    COUNT(*) * 5 as total_minutes
FROM activities
GROUP BY user_id, day, category;

SELECT add_continuous_aggregate_policy('daily_summary',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour'
);
```

---

## 5. API Endpoints

```
Base URL: /api/v1

── Auth ─────────────────────────────────────────────
POST   /auth/register        Register user baru
POST   /auth/login           Login, return JWT token
POST   /auth/logout          Invalidate token
GET    /auth/me              Get current user info

── Activity ─────────────────────────────────────────
POST   /activity/upload      Upload screenshot → analyze → save
GET    /activity             List activities (paginated)
GET    /activity/stats       Get aggregated stats

── Sharing ──────────────────────────────────────────
POST   /share                Invite supervisor
GET    /share/viewers        List siapa yang bisa lihat saya
GET    /share/watching       List siapa yang saya supervise
GET    /share/watching       List siapa yang saya supervise
POST   /share/link           Create public/secret share link
DELETE /share/link/:id       Revoke link
DELETE /share/:id            Revoke access (email invite)

── Supervisor View ──────────────────────────────────
GET    /supervise/:user_id/activity    Lihat activity user lain
GET    /supervise/:user_id/stats       Lihat stats user lain
```

---

## 6. Target Audience

| Persona | Karakteristik | Kebutuhan |
|---------|---------------|-----------|
| **Freelancer** | Kerja sendiri, billing per jam | Track waktu per project, simple |
| **Remote Worker** | Kerja dari rumah | Automatic, non-intrusive |
| **Employee + Supervisor** | Tim distributed | Screenshot proof, transparency |

**Primary:** Remote worker/freelancer yang perlu share activity ke supervisor.

---

## 7. Design Principles

1. **INVISIBLE WHEN WORKING** - Minimize to tray, no popups
2. **GLANCEABLE DASHBOARD** - Today's summary dalam 3 detik
3. **TRUST & TRANSPARENCY** - Clear recording indicator
4. **SUPERVISOR-FRIENDLY** - Clean report, filterable

---

## 8. UI/UX Design

### 8.1 Style Guide

**Theme:** Dark mode default (programmer/remote worker preference)
**Style:** Minimalist + Glassmorphism subtle
**Feel:** Professional, trustworthy, non-intrusive

### 8.2 Color Palette

```
── Dark Theme (Primary) ────────────────────────────
Background Primary:    #0A0A0B (almost black)
Background Secondary:  #141416 (card background)
Background Tertiary:   #1C1C1F (hover states)

Border:                #27272A (zinc-800)
Border Hover:          #3F3F46 (zinc-700)

Text Primary:          #FAFAFA (zinc-50)
Text Secondary:        #A1A1AA (zinc-400)
Text Muted:            #71717A (zinc-500)

── Accent Colors ───────────────────────────────────
Primary (Blue):        #3B82F6 (tracking active)
Primary Hover:         #2563EB

Success (Green):       #22C55E (productive)
Warning (Yellow):      #EAB308 (neutral activity)
Danger (Red):          #EF4444 (stop/error)

── Category Colors ─────────────────────────────────
Coding:                #8B5CF6 (violet)
Meeting:               #06B6D4 (cyan)
Browsing:              #F97316 (orange)
Communication:         #EC4899 (pink)
Design:                #14B8A6 (teal)
Other:                 #6B7280 (gray)
```

### 8.3 Typography

```
Font Family:           Inter (Google Fonts)
                       - Clean, modern, highly readable
                       - Excellent for dashboards

── Scale ───────────────────────────────────────────
Display:               36px / 700 weight (page titles)
Heading 1:             24px / 600 weight (section titles)
Heading 2:             18px / 600 weight (card titles)
Body:                  14px / 400 weight (default text)
Small:                 12px / 400 weight (labels, captions)
Tiny:                  10px / 500 weight (badges)

── Line Height ─────────────────────────────────────
Headings:              1.2
Body:                  1.5
```

### 8.4 Spacing System

```
Base unit: 4px

xs:    4px   (tight spacing)
sm:    8px   (compact elements)
md:    16px  (default padding)
lg:    24px  (section spacing)
xl:    32px  (major sections)
2xl:   48px  (page margins)
```

### 8.5 Border Radius

```
sm:    4px   (buttons, inputs)
md:    8px   (cards)
lg:    12px  (modals, larger cards)
full:  9999px (avatars, badges)
```

---

## 9. Wireframes

### 9.1 Desktop App - System Tray

```
┌─────────────────────────────┐
│  ● Recording                │  ← Green dot = active
├─────────────────────────────┤
│  Today: 4h 32m              │
│  ████████████░░░░  67%      │  ← Progress bar
├─────────────────────────────┤
│  ▶ Resume  │  ⏸ Pause       │  ← Toggle tracking
├─────────────────────────────┤
│  📊 Open Dashboard          │
│  ⚙️ Settings                │
│  ─────────────────────────  │
│  🚪 Quit                    │
└─────────────────────────────┘
```

### 9.2 Desktop App - Main Dashboard

```
┌──────────────────────────────────────────────────────────────────┐
│  ─ □ ×  TimeTrack                              ● Recording  ⚙️   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  TODAY                                           Mon, Jan 20 │ │
│  │                                                              │ │
│  │     ┌─────────┐   ┌─────────┐   ┌─────────┐                 │ │
│  │     │  4h 32m │   │   67%   │   │   12    │                 │ │
│  │     │ tracked │   │productive│   │activities│                │ │
│  │     └─────────┘   └─────────┘   └─────────┘                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐ │
│  │  TIME BY CATEGORY        │  │  ACTIVITY TIMELINE           │ │
│  │                          │  │                              │ │
│  │      ┌────┐              │  │  09:00 ██ VS Code - main.go  │ │
│  │     ╱      ╲  Coding 45% │  │  09:05 ██ VS Code - api.go   │ │
│  │    │   🟣   │  Meeting 20%│  │  09:10 ██ Chrome - GitHub    │ │
│  │     ╲      ╱  Browse 15% │  │  09:15 ██ Slack - #general   │ │
│  │      └────┘   Other 20%  │  │  09:20 ██ VS Code - main.go  │ │
│  │                          │  │  ...                         │ │
│  └──────────────────────────┘  └──────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  WEEKLY TREND                                               │ │
│  │                                                              │ │
│  │  8h ┤                              ▄▄                       │ │
│  │  6h ┤              ▄▄    ▄▄    ██  ██                       │ │
│  │  4h ┤  ▄▄    ▄▄    ██    ██    ██  ██    ░░                 │ │
│  │  2h ┤  ██    ██    ██    ██    ██  ██                       │ │
│  │  0h ┴──Mon───Tue───Wed───Thu───Fri─Sat───Sun──              │ │
│  │                                                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 9.3 Desktop App - Settings

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Settings                                                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TRACKING                                                        │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Screenshot interval           [ 5 minutes      ▼]          │ │
│  │  Start on system startup       [●]                          │ │
│  │  Show notification on capture  [ ]                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ACCOUNT                                                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Email                         john@example.com             │ │
│  │  Server                        https://api.timetrack.app    │ │
│  │  Status                        ● Connected                  │ │
│  │                                                              │ │
│  │  [ Logout ]                                                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  SHARING                                                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  People who can see my activity:                            │ │
│  │                                                              │ │
│  │  👤 supervisor@company.com              [ Revoke ]          │ │
│  │  👤 manager@company.com                 [ Revoke ]          │ │
│  │                                                              │ │
│  │  [ + Invite Supervisor ]                                    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 9.4 Web Dashboard - Supervisor View

```
┌──────────────────────────────────────────────────────────────────────────┐
│  TimeTrack                                    👤 Supervisor ▼  [ Logout ] │
├────────────────┬─────────────────────────────────────────────────────────┤
│                │                                                          │
│  TEAM          │  JOHN DOE's ACTIVITY                    Jan 13-20, 2025 │
│                │  ───────────────────────────────────────────────────────│
│  ┌──────────┐  │                                                          │
│  │ 👤 John  │◀─│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐  │
│  │   Doe    │  │  │  32h    │   │   78%   │   │  45%    │   │   89    │  │
│  │  Online  │  │  │  total  │   │productive│   │ coding  │   │activities│  │
│  └──────────┘  │  └─────────┘   └─────────┘   └─────────┘   └─────────┘  │
│                │                                                          │
│  ┌──────────┐  │  ┌────────────────────────────────────────────────────┐ │
│  │ 👤 Jane  │  │  │  DAILY BREAKDOWN                                   │ │
│  │   Smith  │  │  │                                                     │ │
│  │  Offline │  │  │  Mon  ████████████████░░░░  6h 23m                 │ │
│  └──────────┘  │  │  Tue  ██████████████████░░  7h 12m                 │ │
│                │  │  Wed  ████████████░░░░░░░░  5h 45m                 │ │
│  ┌──────────┐  │  │  Thu  ████████████████████  8h 01m                 │ │
│  │ 👤 Bob   │  │  │  Fri  ██████████████░░░░░░  5h 30m                 │ │
│  │   Lee    │  │  │                                                     │ │
│  │  Online  │  │  └────────────────────────────────────────────────────┘ │
│  └──────────┘  │                                                          │
│                │  ┌────────────────────────────────────────────────────┐ │
│                │  │  RECENT ACTIVITIES                                  │ │
│                │  │                                                     │ │
│                │  │  10:05  VS Code       Coding     Editing API handler│ │
│                │  │  10:00  Chrome        Browsing   Reading Go docs    │ │
│                │  │  09:55  VS Code       Coding     Writing unit tests │ │
│                │  │  09:50  Slack         Comms      Team standup chat  │ │
│                │  │                                                     │ │
│                │  └────────────────────────────────────────────────────┘ │
│                │                                                          │
└────────────────┴─────────────────────────────────────────────────────────┘
```

---

## 10. Component Specifications (shadcn)

### 10.1 Core Components

| Component | shadcn Base | Customization |
|-----------|-------------|---------------|
| Card | `card` | Dark glass effect, subtle border |
| Button | `button` | Primary blue, ghost for secondary |
| Badge | `badge` | Category colors |
| Progress | `progress` | Rounded, category colored |
| Select | `select` | Dark dropdown |
| Switch | `switch` | Green when on |
| Avatar | `avatar` | Team member pics |
| Tooltip | `tooltip` | Activity details on hover |

### 10.2 Custom Components

| Component | Purpose |
|-----------|---------|
| `StatusIndicator` | Recording on/off dot |
| `TimeDisplay` | Large formatted time (4h 32m) |
| `CategoryPie` | Donut chart by category |
| `ActivityTimeline` | Vertical timeline list |
| `WeeklyChart` | Bar chart 7 days |
| `TeamMemberCard` | Supervisor team list |

---

## 11. Animations & Micro-interactions

| Interaction | Animation |
|-------------|-----------|
| Recording pulse | Green dot gentle pulse (1.5s loop) |
| Card hover | Subtle lift (translateY -2px) + border glow |
| Button click | Scale down 0.98 → 1 |
| Page transition | Fade in (150ms ease) |
| Chart load | Bars grow from 0 (300ms stagger) |
| Toast notification | Slide in from top right |

---

## 12. Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| Desktop (default) | 1200px+ | Full layout |
| Desktop small | 900-1199px | Condensed sidebar |
| Tablet | 600-899px | Stack cards |
| Mobile | <600px | Single column |

Note: Desktop app fixed minimum 800x600px.

---

## 13. Accessibility

- Minimum contrast ratio 4.5:1 for text
- Focus indicators on all interactive elements
- Keyboard navigation support
- Screen reader labels for icons
- Reduced motion option

---

## Next Steps

1. [ ] Setup project structure
2. [ ] Implement backend API (Go + Gin)
3. [ ] Setup PostgreSQL + TimescaleDB
4. [ ] Build desktop app (Tauri + React)
5. [ ] Build web dashboard
6. [ ] Integrate Z.AI API
7. [ ] Testing & deployment
