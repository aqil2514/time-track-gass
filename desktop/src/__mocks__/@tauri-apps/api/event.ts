// Manual mock for @tauri-apps/api/event
import { vi } from 'vitest'

export const listen = vi.fn(() => ({
  unlisten: vi.fn()
}))
