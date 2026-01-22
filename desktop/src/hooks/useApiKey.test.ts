// desktop/src/hooks/useApiKey.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useApiKey } from './useApiKey'
import * as api from '../lib/api'
import * as AuthContext from '../context/AuthContext'

// Mock API and Auth Context
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
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

describe('useApiKey', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when authenticated', () => {
    it('fetches API key on mount', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: { id: 'user-123', email: 'user@example.com', name: 'Test User', role: 'member', organization_id: 'org-123' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      vi.mocked(api.api.get).mockResolvedValueOnce({
        data: {
          success: true,
          data: { api_key: 'test-api-key-12345' }
        }
      })

      const { result } = renderHook(() => useApiKey())

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(api.api.get).toHaveBeenCalledWith('/org/api-key')
      expect(result.current.apiKey).toBe('test-api-key-12345')
    })

    it('sets apiKey to null when 404 (not configured)', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: { id: 'user-123', email: 'user@example.com', name: 'Test User', role: 'member', organization_id: 'org-123' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      vi.mocked(api.api.get).mockRejectedValueOnce({
        response: { status: 404 }
      })

      const { result } = renderHook(() => useApiKey())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.apiKey).toBeNull()
      // Should not log error for 404
      const logger = await import('../lib/logger')
      expect(logger.logger.error).not.toHaveBeenCalled()
    })

    it('logs error for non-404 failures', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: { id: 'user-123', email: 'user@example.com', name: 'Test User', role: 'member', organization_id: 'org-123' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      vi.mocked(api.api.get).mockRejectedValueOnce({
        response: { status: 500 }
      })

      const { result } = renderHook(() => useApiKey())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.apiKey).toBeNull()

      const logger = await import('../lib/logger')
      expect(logger.logger.error).toHaveBeenCalledWith(
        'Failed to fetch API key',
        expect.any(Object)
      )
    })

    it('handles network error', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: { id: 'user-123', email: 'user@example.com', name: 'Test User', role: 'member', organization_id: 'org-123' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      vi.mocked(api.api.get).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useApiKey())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.apiKey).toBeNull()
    })

    it('sets isLoading to false after fetch completes', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: { id: 'user-123', email: 'user@example.com', name: 'Test User', role: 'member', organization_id: 'org-123' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      vi.mocked(api.api.get).mockResolvedValueOnce({
        data: {
          success: true,
          data: { api_key: 'secret-key' }
        }
      })

      const { result } = renderHook(() => useApiKey())

      // Initially loading
      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // After fetch completes
      expect(result.current.apiKey).toBe('secret-key')
    })
  })

  describe('when not authenticated', () => {
    it('sets apiKey to null', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      const { result } = renderHook(() => useApiKey())

      expect(result.current.apiKey).toBeNull()
      expect(api.api.get).not.toHaveBeenCalled()
    })

    it('does not fetch API key', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      renderHook(() => useApiKey())

      expect(api.api.get).not.toHaveBeenCalled()
    })

    it('sets isLoading to false when not authenticated', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      const { result } = renderHook(() => useApiKey())

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('authentication state changes', () => {
    it('fetches key when authentication becomes true', async () => {
      const { rerender } = renderHook(() => useApiKey(), {
        wrapper: ({ children }) => {
          // First render - not authenticated
          vi.mocked(AuthContext.useAuth).mockReturnValue({
            user: null,
            isAuthenticated: false,
            login: vi.fn(),
            logout: vi.fn(),
            loading: false
          })
          return children
        }
      })

      // Now update to authenticated
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: { id: 'user-123', email: 'user@example.com', name: 'Test User', role: 'member', organization_id: 'org-123' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      vi.mocked(api.api.get).mockResolvedValueOnce({
        data: {
          success: true,
          data: { api_key: 'new-key' }
        }
      })

      // Re-render with authenticated state
      const { result } = renderHook(() => useApiKey())

      await waitFor(() => {
        expect(api.api.get).toHaveBeenCalledWith('/org/api-key')
      })
    })

    it('clears API key when authentication becomes false', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: { id: 'user-123', email: 'user@example.com', name: 'Test User', role: 'member', organization_id: 'org-123' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      vi.mocked(api.api.get).mockResolvedValueOnce({
        data: {
          success: true,
          data: { api_key: 'stored-key' }
        }
      })

      const { result, rerender } = renderHook(() => useApiKey())

      await waitFor(() => {
        expect(result.current.apiKey).toBe('stored-key')
      })

      // Change to not authenticated
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      rerender()

      expect(result.current.apiKey).toBeNull()
    })
  })

  describe('response handling', () => {
    it('handles empty API key response', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: { id: 'user-123', email: 'user@example.com', name: 'Test User', role: 'member', organization_id: 'org-123' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      vi.mocked(api.api.get).mockResolvedValueOnce({
        data: {
          success: true,
          data: { api_key: '' }
        }
      })

      const { result } = renderHook(() => useApiKey())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.apiKey).toBeNull()
    })

    it('handles missing api_key in response', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: { id: 'user-123', email: 'user@example.com', name: 'Test User', role: 'member', organization_id: 'org-123' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      vi.mocked(api.api.get).mockResolvedValueOnce({
        data: {
          success: true,
          data: {}
        }
      })

      const { result } = renderHook(() => useApiKey())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.apiKey).toBeNull()
    })

    it('handles malformed response', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: { id: 'user-123', email: 'user@example.com', name: 'Test User', role: 'member', organization_id: 'org-123' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      vi.mocked(api.api.get).mockResolvedValueOnce({
        data: {
          success: false
        }
      })

      const { result } = renderHook(() => useApiKey())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.apiKey).toBeNull()
    })
  })

  describe('hook return value', () => {
    it('returns apiKey and isLoading state', async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: { id: 'user-123', email: 'user@example.com', name: 'Test User', role: 'member', organization_id: 'org-123' },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        loading: false
      })

      vi.mocked(api.api.get).mockResolvedValueOnce({
        data: {
          success: true,
          data: { api_key: 'my-api-key' }
        }
      })

      const { result } = renderHook(() => useApiKey())

      // Check return value structure
      expect(result.current).toHaveProperty('apiKey')
      expect(result.current).toHaveProperty('isLoading')
      expect(result.current.apiKey === null || typeof result.current.apiKey === 'string').toBe(true)
      expect(typeof result.current.isLoading).toBe('boolean')

      await waitFor(() => {
        expect(result.current.apiKey).toBe('my-api-key')
        expect(result.current.isLoading).toBe(false)
      })
    })
  })
})
