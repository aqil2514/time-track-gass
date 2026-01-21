# Task 13: Define Session Models

## Meta
- **File**: `backend/internal/models/session.go`
- **Action**: create
- **Depends**: [12]
- **Priority**: P1
- **Phase**: 3

## Objective
Define Go structs for session operations.

## Requirements
- Define Session model
- Define SessionListInput for queries
- Define SessionSummaryPayload for AI

## Acceptance Criteria
- [ ] `Session` struct defined
- [ ] `SessionListInput` struct defined
- [ ] Session grouping constants defined
- [ ] Proper JSON/DB tags

## Implementation Notes

```go
// backend/internal/models/session.go

package models

import (
	"time"

	"github.com/google/uuid"
)

// Session represents a grouped session of activities
type Session struct {
	ID                  uuid.UUID  `json:"id" db:"id"`
	UserID              uuid.UUID  `json:"user_id" db:"user_id"`
	Category            string     `json:"category" db:"category"`
	AppName             string     `json:"app_name" db:"app_name"`
	StartedAt           time.Time  `json:"started_at" db:"started_at"`
	EndedAt             *time.Time `json:"ended_at" db:"ended_at"`
	ActivityCount       int        `json:"activity_count" db:"activity_count"`
	TotalMinutes        int        `json:"total_minutes" db:"total_minutes"`
	Summary             string     `json:"summary" db:"summary"`
	SummaryGeneratedAt  *time.Time `json:"summary_generated_at" db:"summary_generated_at"`
	CreatedAt           time.Time  `json:"created_at" db:"created_at"`
}

// SessionListInput represents query parameters for listing sessions
type SessionListInput struct {
	From     string `form:"from"`
	To       string `form:"to"`
	Category string `form:"category"`
	Page     int    `form:"page,default=1"`
	PerPage  int    `form:"per_page,default=20"`
}

// SessionSummaryRequest represents a request to generate session summary
type SessionSummaryRequest struct {
	SessionID   uuid.UUID  `json:"session_id"`
	Activities  []Activity `json:"activities"`
	ForceRegen  bool       `json:"force_regen"`  // Force regeneration even if exists
}

// Session Grouping Constants
const (
	// MaxGapDuration defines the maximum time gap between activities in a session
	MaxGapDuration = 30 * time.Minute

	// MinimumActivitiesPerSession is the minimum activities to form a session
	MinimumActivitiesPerSession = 1
)

// GroupingRule determines if two activities should be in the same session
type GroupingRule struct {
	SameCategory       bool
	MaxTimeGap         time.Duration
	PreferSameApp      bool
}

// DefaultSessionGroupingRules returns default session grouping rules
func DefaultSessionGroupingRules() GroupingRule {
	return GroupingRule{
		SameCategory:  true,  // Must be same category
		MaxTimeGap:    MaxGapDuration,
		PreferSameApp: false, // Optional: prefer same app but not required
	}
}

// ShouldStartNewSession determines if a new session should be started
func ShouldStartNewSession(lastActivity, newActivity *Activity, rules GroupingRule) bool {
	// No previous activity, start new session
	if lastActivity == nil {
		return false // Don't start new, this is the first
	}

	// Category change → new session
	if rules.SameCategory && lastActivity.Category != newActivity.Category {
		return true
	}

	// Time gap exceeded → new session
	gap := newActivity.CapturedAt.Sub(lastActivity.CapturedAt)
	if gap > rules.MaxTimeGap {
		return true
	}

	return false
}
```

## Session Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                     SESSION LIFECYCLE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. ACTIVITY UPLOADED                                        │
│     └─ Check if belongs to existing session                  │
│         └─ Yes → Add to session                             │
│         └─ No → Create new session                          │
│                                                              │
│  2. SESSION COMPLETE                                         │
│     └─ Gap > 30min detected                                 │
│     └─ Mark ended_at                                        │
│     └─ Queue for summary generation                         │
│                                                              │
│  3. SUMMARY GENERATED                                       │
│     └─ AI processes activities in session                   │
│     └─ Stores summary in session.summary                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```
