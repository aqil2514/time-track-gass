// web/src/lib/api-client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from './api-client'
import { UnauthorizedError, ValidationError, NotFoundError, ApiError } from './errors'

// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear localStorage before each test
    localStorage.clear()
    // Reset fetch mock to return success by default
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: {} }),
    } as Response)
    // Clear internal token cache by calling clearToken
    apiClient.clearToken()
  })

  describe('token management', () => {
    it('stores token in localStorage when setToken is called', () => {
      const testToken = 'test-token-123'
      apiClient.setToken(testToken)
      expect(localStorage.getItem('token')).toBe(testToken)
    })

    it('retrieves token from localStorage when getToken is called', () => {
      const testToken = 'test-token-456'
      localStorage.setItem('token', testToken)
      const retrievedToken = apiClient.getToken()
      expect(retrievedToken).toBe(testToken)
    })

    it('removes token from localStorage when clearToken is called', () => {
      localStorage.setItem('token', 'test-token')
      apiClient.clearToken()
      expect(localStorage.getItem('token')).toBeNull()
    })

    it('caches token in memory after first retrieval', () => {
      const testToken = 'test-token-789'
      localStorage.setItem('token', testToken)

      apiClient.getToken() // First call - reads from localStorage and caches
      localStorage.removeItem('token') // Remove from localStorage
      const cachedToken = apiClient.getToken() // Second call - should use cached value

      expect(cachedToken).toBe(testToken)
    })
  })

  describe('request method with Authorization header', () => {
    it('attaches Authorization header when token is set', async () => {
      const testToken = 'test-token'
      apiClient.setToken(testToken)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: '123', name: 'Test Org', timezone: 'Asia/Jakarta' } }),
      } as Response)

      await apiClient.getOrganization()

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/org',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${testToken}`,
          }),
        })
      )
    })

    it('does not attach Authorization header when token is not set', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: '123', name: 'Test Org', timezone: 'Asia/Jakarta' } }),
      } as Response)

      await apiClient.getOrganization()

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/org',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String),
          }),
        })
      )
    })

    it('handles 401 response with UnauthorizedError', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          error: { message: 'Unauthorized access', code: 'UNAUTHORIZED' },
        }),
      } as Response)

      await expect(apiClient.getOrganization()).rejects.toThrow(UnauthorizedError)
      await expect(apiClient.getOrganization()).rejects.toThrow('Unauthorized access')
    })

    it('handles 403 response with ApiError', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: { message: 'Forbidden', code: 'FORBIDDEN' },
        }),
      } as Response)

      await expect(apiClient.getOrganization()).rejects.toThrow(ApiError)
    })

    it('handles 404 response with NotFoundError', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: { message: 'Resource not found', code: 'NOT_FOUND' },
        }),
      } as Response)

      await expect(apiClient.getOrganization()).rejects.toThrow(NotFoundError)
    })

    it('handles 400 response with ValidationError', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: { message: 'Invalid input', code: 'VALIDATION_ERROR' },
        }),
      } as Response)

      await expect(apiClient.updateOrganizationSettings({ name: 'Test' })).rejects.toThrow(ValidationError)
    })

    it('handles 409 conflict with ApiError', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          error: { message: 'Resource already exists', code: 'EMAIL_EXISTS' },
        }),
      } as Response)

      await expect(apiClient.addMember({ email: 'test@example.com', password: 'pass123' })).rejects.toThrow(ApiError)
    })

    it('handles network error gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(apiClient.getOrganization()).rejects.toThrow('Network error')
    })

    it('handles 500 error with ApiError', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
        }),
      } as Response)

      await expect(apiClient.getOrganization()).rejects.toThrow(ApiError)
    })
  })

  describe('auth methods', () => {
    it('login stores token on success', async () => {
      const testToken = 'login-token-123'
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            token: testToken,
            user: { id: '123', email: 'test@example.com', name: 'Test User', role: 'member', created_at: '2024-01-01T00:00:00Z' }
          },
        }),
      } as Response)

      await apiClient.login({ email: 'test@example.com', password: 'password123' })

      expect(localStorage.getItem('token')).toBe(testToken)
    })

    it('logout clears token', async () => {
      apiClient.setToken('test-token')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      await apiClient.logout()

      expect(localStorage.getItem('token')).toBeNull()
    })

    it('register creates new user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { id: '123', email: 'new@example.com', name: 'New User', role: 'member', created_at: '2024-01-01T00:00:00Z' }
        }),
      } as Response)

      const response = await apiClient.register({
        email: 'new@example.com',
        password: 'password123',
        name: 'New User'
      })

      expect(response.data.email).toBe('new@example.com')
    })
  })

  describe('activities', () => {
    it('getActivities builds query params correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          meta: { total: 0 }
        }),
      } as Response)

      await apiClient.getActivities({
        from: '2024-01-01',
        to: '2024-01-31',
        category: 'coding',
        page: 2,
        per_page: 50
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/activity?from=2024-01-01&to=2024-01-31&category=coding&page=2&per_page=50',
        expect.any(Object)
      )
    })

    it('getStats with date range', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { total_hours: 8.5, category_breakdown: {} }
        }),
      } as Response)

      await apiClient.getStats('2024-01-01', '2024-01-31')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/activity/stats?from=2024-01-01&to=2024-01-31',
        expect.any(Object)
      )
    })

    it('uploadActivity sends correct payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { id: '123', app_name: 'VS Code', window_title: 'main.go', category: 'coding', summary: 'Working on code' }
        }),
      } as Response)

      const activity = {
        app_name: 'VS Code',
        window_title: 'main.go',
        category: 'coding',
        summary: 'Working on code',
        captured_at: '2024-01-01T10:00:00Z'
      }

      await apiClient.uploadActivity(activity)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/activity/upload',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('VS Code')
        })
      )
    })
  })

  describe('organization', () => {
    it('getOrganization returns org data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { id: '123', name: 'Test Org', timezone: 'Asia/Jakarta' }
        }),
      } as Response)

      const response = await apiClient.getOrganization()

      expect(response.data.name).toBe('Test Org')
    })

    it('updateOrganizationSettings sends patch request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { id: '123', name: 'Updated Org', timezone: 'America/New_York' }
        }),
      } as Response)

      await apiClient.updateOrganizationSettings({
        name: 'Updated Org',
        timezone: 'America/New_York'
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/org/settings',
        expect.objectContaining({
          method: 'PATCH'
        })
      )
    })

    it('addMember sends correct payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { id: '123', email: 'member@example.com', name: 'Member', role: 'member' }
        }),
      } as Response)

      await apiClient.addMember({
        email: 'member@example.com',
        password: 'password123',
        name: 'Member',
        role: 'member'
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/org/members',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('member@example.com')
        })
      )
    })
  })

  describe('shares', () => {
    it('createShare sends email in payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { id: '123', viewer_id: '456', owner_id: '789' }
        }),
      } as Response)

      await apiClient.createShare('viewer@example.com')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/share',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('viewer@example.com')
        })
      )
    })

    it('deleteShare sends delete request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      await apiClient.deleteShare('share-123')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/share/share-123',
        expect.objectContaining({
          method: 'DELETE'
        })
      )
    })

    it('getUserActivity includes query params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: []
        }),
      } as Response)

      await apiClient.getUserActivity('user-123', {
        from: '2024-01-01',
        to: '2024-01-31',
        page: 1
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/supervise/user-123/activity?from=2024-01-01&to=2024-01-31&page=1',
        expect.any(Object)
      )
    })
  })

  describe('notifications', () => {
    it('getNotifications with query params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: []
        }),
      } as Response)

      await apiClient.getNotifications({
        unread_only: true,
        limit: 10
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/org/notifications?unread_only=true&limit=10',
        expect.any(Object)
      )
    })

    it('markNotificationRead sends patch request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      await apiClient.markNotificationRead('notif-123')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/org/notifications/notif-123',
        expect.objectContaining({
          method: 'PATCH'
        })
      )
    })
  })

  describe('password management', () => {
    it('updatePassword sends patch request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      await apiClient.updatePassword({
        old_password: 'oldpass123',
        new_password: 'newpass456'
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/auth/password',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('old_password')
        })
      )
    })
  })
})
