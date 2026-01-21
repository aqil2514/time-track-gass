# Build & Run Commands
Backend: `cd backend && go run cmd/api/main.go` | Tests: `cd test && python test_login.py`
Web: `cd web && pnpm dev` | Lint: `pnpm lint`
Desktop: `cd desktop && pnpm tauri dev` | Build: `pnpm build`

# Code Style
**Go**: Standard library formatting, snake_case imports, error-first returns, context-first funcs. Use pgx pool, UUID types. Struct fields PascalCase, JSON tags snake_case. Early returns, max 2 nesting.
**TS/React**: Tailwind CSS for styling, functional components, hooks only. Zustand for state. File names PascalCase (components) or kebab-case (pages/hooks).
**Rust**: snake_case, async functions use Result<T, E>, Tauri commands #[tauri::command]. Atomic ordering for thread-safe globals.

# Error Handling
Go: Return errors, wrap with context when needed. TS/React: Custom ApiError classes from errors.ts. Rust: Result<T, String> for Tauri commands.

# Conventions
No comments unless asked. Files under 300 lines. Import sorting required. Use existing libraries/frameworks - check codebase first.
