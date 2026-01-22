// Manual mock for @tauri-apps/api/core
// This ensures dynamic imports get the same mock reference
import { vi } from 'vitest'

export const invoke = vi.fn()
