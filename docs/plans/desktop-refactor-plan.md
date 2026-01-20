# Desktop App Refactor & Design Plan

**Goal:** Transform the current prototype Desktop App (`desktop/src`) into a premium, glassmorphism-styled application that matches the design documents and the visual quality of the Web Dashboard.

## Phase 1: Foundation & Dependencies

### Task 1.1: Install Dependencies
Install missing UI utility libraries to support `shadcn/ui` style components.
- `clsx`: For conditional class joining
- `tailwind-merge`: For resolving tailwind class conflicts
- `lucide-react`: For consistent icons (used in design doc)

### Task 1.2: Port Design System
Update `desktop/src/index.css` to match `web/src/index.css`.
- Copy global CSS variables (colors, radius).
- Note: Use the translucent color definitions (`oklch(... / 0.4)`) to enable glassmorphism.
- Add the background radial gradients.
- Add animation keyframes (`pulse-soft`).

### Task 1.3: Setup Utility Functions
Create `desktop/src/lib/utils.ts` (copy from `web/src/lib/utils.ts`).
- Implement `cn(...)` helper.
- Implement `formatTime`, `formatDate` helpers.

## Phase 2: Component Architecture

### Task 2.1: Create Component Directory
Create structural directories:
- `desktop/src/components` (UI primitives)
- `desktop/src/components/layout` (Layout components)
- `desktop/src/hooks` (Custom hooks like `useScreenshot`)

### Task 2.2: Implement Core UI Components
Port these components from `web` or implement from scratch with Glassmorphism:
- `Card` (Header, Title, Content, Footer) - *Critical for the glass look*
- `Button` (Primary, Ghost, Destructive variants)
- `Badge` (For status indicators)
- `ScrollArea` (If needed for activity list)

### Task 2.3: Implement Feature Components
- `StatusIndicator`: The green pulsing dot component.
- `ActivityFeed`: The list of recent activities/screenshots.
- `StatsGrid`: The top row summary (Time, Productivity, Activity Count).

## Phase 3: Main Layout & Logic

### Task 3.1: Refactor App Logic (Hooks)
Extract logic from `App.tsx` into `hooks/useCapture.ts`.
- Manage `screenshots`, `isCapturing`, `interval` states.
- Handle Tauri `invoke` calls safely.

### Task 3.2: Rebuild App.tsx
Implement the 2-column layout defined in Wireframe 9.2 using Grid.
- **Header**: App Title + Status Indicator + Settings Icon.
- **Left Column**:
  - `StatsCard` (Today's summary).
  - `CategoryPie` (Placeholder or real data if available).
- **Right Column**:
  - `ActivityTimeline` (List of screenshots).
- **Bottom**: Controls (Start/Stop, Interval).

## Phase 4: Verification
- Verify `pnpm dev` runs without errors.
- Verify Glassmorphism effects (blur, transparency) work on Windows.
- Verify screenshots still capture correctly and appear in the new list UI.
