// desktop/src/hooks/useNotification.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useNotification, NotificationPayload } from './useNotification'
import * as api from '../lib/api'
import * as AuthContext from '../context/AuthContext'

// Mock API and Auth Context
vi.mock('../lib/api', () => ({
  api: {
    post: vi.fn(),
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('useNotification', () => {
  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    name: 'Test User',
    role: 'member',
    organization_id: 'org-123'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('sendNotification', () => {
    it('returns false when user is not authenticated', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      const { result } = renderHook(() => useNotification())

      const payload: NotificationPayload = {
        type: 'system',
        title: 'Test Notification',
        message: 'Test message'
      }

      const resultBool = await result.current.sendNotification(payload)

      expect(resultBool).toBe(false)
      expect(api.api.post).not.toHaveBeenCalled()
    })

    it('sends notification to backend when authenticated', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      vi.mocked(api.api.post).mockResolvedValueOnce({
        data: {
          success: true,
          data: { id: 'notif-123', type: 'system', title: 'Test', message: 'Test message' }
        }
      })

      const { result } = renderHook(() => useNotification())

      const payload: NotificationPayload = {
        type: 'ai_failure',
        title: 'AI Analysis Failed',
        message: 'Screenshot analysis failed'
      }

      const resultBool = await result.current.sendNotification(payload)

      expect(resultBool).toBe(true)
      expect(api.api.post).toHaveBeenCalledWith('/org/notifications', {
        type: 'ai_failure',
        title: 'AI Analysis Failed',
        message: 'Screenshot analysis failed',
        metadata: undefined
      })
    })

    it('includes metadata in notification payload', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      vi.mocked(api.api.post).mockResolvedValueOnce({
        data: { success: true, data: {} }
      })

      const { result } = renderHook(() => useNotification())

      const payload: NotificationPayload = {
        type: 'ai_failure',
        title: 'AI Failed',
        message: 'Analysis error',
        metadata: {
          activity_id: 'activity-123',
          error_code: 'TIMEOUT'
        }
      }

      await result.current.sendNotification(payload)

      expect(api.api.post).toHaveBeenCalledWith('/org/notifications', {
        type: 'ai_failure',
        title: 'AI Failed',
        message: 'Analysis error',
        metadata: {
          activity_id: 'activity-123',
          error_code: 'TIMEOUT'
        }
      })
    })

    it('returns false when API request fails', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      vi.mocked(api.api.post).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useNotification())

      const payload: NotificationPayload = {
        type: 'sync_error',
        title: 'Sync Failed',
        message: 'Failed to sync data'
      }

      const resultBool = await result.current.sendNotification(payload)

      expect(resultBool).toBe(false)
    })
  })

  describe('notifyAIFailure', () => {
    it('sends AI failure notification with user context', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      vi.mocked(api.api.post).mockResolvedValueOnce({
        data: { success: true, data: {} }
      })

      const { result } = renderHook(() => useNotification())

      await result.current.notifyAIFailure('API timeout', 3)

      expect(api.api.post).toHaveBeenCalledWith('/org/notifications', {
        type: 'ai_failure',
        title: 'AI Analysis Failed for Test User',
        message: 'Screenshot analysis failed after 3 retries. Error: API timeout',
        metadata: expect.objectContaining({
          member_id: 'user-123',
          member_name: 'Test User',
          error: 'API timeout',
          retry_count: 3,
          timestamp: expect.any(String)
        })
      })
    })

    it('uses email if name is not available', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: { ...mockUser, name: '' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      vi.mocked(api.api.post).mockResolvedValueOnce({
        data: { success: true, data: {} }
      })

      const { result } = renderHook(() => useNotification())

      await result.current.notifyAIFailure('Rate limit exceeded', 5)

      expect(api.api.post).toHaveBeenCalledWith('/org/notifications', expect.objectContaining({
        type: 'ai_failure',
        title: 'AI Analysis Failed for user@example.com'
      }))
    })
  })

  describe('notifySyncError', () => {
    it('sends sync error notification with user context', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      vi.mocked(api.api.post).mockResolvedValueOnce({
        data: { success: true, data: {} }
      })

      const { result } = renderHook(() => useNotification())

      await result.current.notifySyncError('Network unreachable')

      expect(api.api.post).toHaveBeenCalledWith('/org/notifications', {
        type: 'sync_error',
        title: 'Sync Error for Test User',
        message: 'Failed to sync offline data. Error: Network unreachable',
        metadata: expect.objectContaining({
          member_id: 'user-123',
          member_name: 'Test User',
          error: 'Network unreachable',
          timestamp: expect.any(String)
        })
      })
    })

    it('returns false when not authenticated', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      const { result } = renderHook(() => useNotification())

      const resultBool = await result.current.notifySyncError('Test error')

      expect(resultBool).toBe(false)
      expect(api.api.post).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('handles 401 unauthorized gracefully', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      vi.mocked(api.api.post).mockRejectedValueOnce({
        response: { status: 401 }
      })

      const { result } = renderHook(() => useNotification())

      const resultBool = await result.current.sendNotification({
        type: 'system',
        title: 'Test',
        message: 'Test'
      })

      expect(resultBool).toBe(false)
    })

    it('handles 500 server error gracefully', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      vi.mocked(api.api.post).mockRejectedValueOnce({
        response: { status: 500 }
      })

      const { result } = renderHook(() => useNotification())

      const resultBool = await result.current.sendNotification({
        type: 'system',
        title: 'Test',
        message: 'Test'
      })

      expect(resultBool).toBe(false)
    })

    it('logs warning when user is not authenticated', async () => {
      const logger = await import('../lib/logger')

      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      const { result } = renderHook(() => useNotification())

      await result.current.sendNotification({
        type: 'system',
        title: 'Test',
        message: 'Test'
      })

      expect(logger.logger.warn).toHaveBeenCalledWith(
        'Cannot send notification: user not authenticated'
      )
    })

    it('logs warning when API request fails', async () => {
      const logger = await import('../lib/logger')

      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      vi.mocked(api.api.post).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useNotification())

      await result.current.sendNotification({
        type: 'system',
        title: 'Test',
        message: 'Test'
      })

      expect(logger.logger.warn).toHaveBeenCalledWith(
        'Failed to send notification to backend',
        expect.any(Error)
      )
    })
  })

  describe('notification types', () => {
    it('supports ai_failure type', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      vi.mocked(api.api.post).mockResolvedValueOnce({
        data: { success: true, data: {} }
      })

      const { result } = renderHook(() => useNotification())

      await result.current.sendNotification({
        type: 'ai_failure',
        title: 'AI Failed',
        message: 'Analysis timeout'
      })

      expect(api.api.post).toHaveBeenCalledWith(
        '/org/notifications',
        expect.objectContaining({
          type: 'ai_failure'
        })
      )
    })

    it('supports sync_error type', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      vi.mocked(api.api.post).mockResolvedValueOnce({
        data: { success: true, data: {} }
      })

      const { result } = renderHook(() => useNotification())

      await result.current.sendNotification({
        type: 'sync_error',
        title: 'Sync Failed',
        message: 'Offline queue sync failed'
      })

      expect(api.api.post).toHaveBeenCalledWith(
        '/org/notifications',
        expect.objectContaining({
          type: 'sync_error'
        })
      )
    })

    it('supports system type', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      vi.mocked(api.api.post).mockResolvedValueOnce({
        data: { success: true, data: {} }
      })

      const { result } = renderHook(() => useNotification())

      await result.current.sendNotification({
        type: 'system',
        title: 'System Alert',
        message: 'Disk space low'
      })

      expect(api.api.post).toHaveBeenCalledWith(
        '/org/notifications',
        expect.objectContaining({
          type: 'system'
        })
      )
    })
  })
})
