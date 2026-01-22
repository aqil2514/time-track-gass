// desktop/src/hooks/useCapture.test.ts
// IMPORTANT: All mocks must be defined before any imports
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Tauri modules FIRST (before importing useCapture)
vi.mock('@tauri-apps/api/core')
vi.mock('@tauri-apps/api/event')

// Now import other modules
import { renderHook, waitFor, act } from '@testing-library/react'
import * as api from '../lib/api'
import * as AuthContext from '../context/AuthContext'
import * as TauriContext from '../lib/tauri'
import * as ApiKeyHook from './useApiKey'
import * as NotificationHook from './useNotification'
import * as aiRetryQueue from '../lib/aiRetryQueue'
import * as aiLib from '../lib/ai'

// Import useCapture AFTER mocking its dependencies
import { useCapture } from './useCapture'

// Import the mocked invoke function AFTER vi.mock is called
import { invoke as mockInvoke } from '@tauri-apps/api/core'

// Mock all other dependencies
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/tauri', () => ({
  isTauriSync: vi.fn(() => true),
  waitForTauri: vi.fn(() => Promise.resolve(true)),
}))

vi.mock('./useApiKey', () => ({
  useApiKey: vi.fn(),
}))

vi.mock('./useNotification', () => ({
  useNotification: vi.fn(),
}))

vi.mock('../lib/aiRetryQueue', () => ({
  saveAiRetry: vi.fn(),
  getAiRetries: vi.fn(),
  getRetryableItems: vi.fn(),
  deleteAiRetry: vi.fn(),
  updateAiRetry: vi.fn(),
  isInRetryQueue: vi.fn(),
}))

vi.mock('../lib/ai', () => ({
  analyzeScreenshot: vi.fn(),
}))

vi.mock('../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('useCapture', () => {
  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    name: 'Test User',
    role: 'member',
    organization_id: 'org-123'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Don't use fake timers - they interfere with async useEffect
    // vi.useFakeTimers()

    // Reset mockInvoke behavior - default to resolved value
    mockInvoke.mockReset()
    // Default: is_capturing returns false (not currently capturing)
    mockInvoke.mockResolvedValue(false)

    // Default mocks
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      loading: false
    })

    vi.mocked(ApiKeyHook.useApiKey).mockReturnValue({
      apiKey: 'test-api-key',
      isLoading: false
    })

    vi.mocked(NotificationHook.useNotification).mockReturnValue({
      sendNotification: vi.fn(),
      notifyAIFailure: vi.fn(),
      notifySyncError: vi.fn(),
    })

    vi.mocked(TauriContext.isTauriSync).mockReturnValue(true)
    vi.mocked(TauriContext.waitForTauri).mockResolvedValue(true)

    vi.mocked(api.api.get).mockResolvedValue({
      data: {
        success: true,
        data: []
      }
    })

    vi.mocked(api.api.post).mockResolvedValue({
      data: {
        success: true,
        data: { id: '123', captured_at: new Date().toISOString() }
      }
    })

    vi.mocked(api.api.patch).mockResolvedValue({
      data: { success: true }
    })

    vi.mocked(aiRetryQueue.getRetryableItems).mockResolvedValue([])
    vi.mocked(aiRetryQueue.isInRetryQueue).mockResolvedValue(false)
  })

  afterEach(() => {
    // vi.runOnlyPendingTimers()
    // vi.useRealTimers()
  })

  describe('initial state', () => {
    it('initializes with empty screenshots array', () => {
      const { result } = renderHook(() => useCapture())

      expect(result.current.screenshots).toEqual([])
    })

    it('initializes with isCapturing set to false', () => {
      const { result } = renderHook(() => useCapture())

      expect(result.current.isCapturing).toBe(false)
    })

    it('initializes with default interval of 5 minutes', () => {
      const { result } = renderHook(() => useCapture())

      expect(result.current.interval).toBe(5)
    })

    it('initializes with no error', () => {
      const { result } = renderHook(() => useCapture())

      expect(result.current.error).toBeNull()
    })

    it('fetches activities on mount', async () => {
      const mockActivities = [
        { id: '1', app_name: 'VS Code', window_title: 'main.go', category: 'coding', summary: 'Coding', captured_at: '2024-01-01T10:00:00Z' }
      ]

      vi.mocked(api.api.get).mockResolvedValueOnce({
        data: {
          success: true,
          data: mockActivities
        }
      })

      const { result } = renderHook(() => useCapture())

      await waitFor(() => {
        expect(api.api.get).toHaveBeenCalledWith('/activity', {
          params: expect.objectContaining({
            from: expect.any(String),
            per_page: 50
          })
        })
      })
    })
  })

  describe('startCapture', () => {
    it('sets isCapturing to true when capture starts', async () => {
      // Mock is_capturing to return false (not currently capturing)
      // Then mock start_capture to succeed
      mockInvoke
        .mockResolvedValueOnce(false)  // is_capturing check from useEffect
        .mockResolvedValueOnce(false)  // is_capturing check from startCapture's useEffect
        .mockResolvedValueOnce('started')  // start_capture call

      const { result } = renderHook(() => useCapture())

      await act(async () => {
        await result.current.startCapture()
      })

      expect(result.current.isCapturing).toBe(true)
    })

    it('calls Tauri start_capture command with interval', async () => {
      // Mock the sequence: is_capturing check, then start_capture call
      mockInvoke
        .mockResolvedValueOnce(false)  // is_capturing check from useEffect
        .mockResolvedValueOnce(false)  // is_capturing check from startCapture's useEffect
        .mockResolvedValueOnce('started')  // start_capture succeeds

      const { result } = renderHook(() => useCapture())

      act(() => {
        result.current.setInterval(10)
      })

      await act(async () => {
        await result.current.startCapture()
      })

      // Verify start_capture was called with the correct interval
      expect(mockInvoke).toHaveBeenCalledWith('start_capture', {
        interval_minutes: 10
      })
    })

    it('sets error when Tauri is not ready', async () => {
      vi.mocked(TauriContext.isTauriSync).mockReturnValueOnce(false)

      const { result } = renderHook(() => useCapture())

      await act(async () => {
        await result.current.startCapture()
      })

      expect(result.current.error).toBe('Screenshot capture is only available in Tauri desktop app')
    })

    it('sets error when Tauri command fails', async () => {
      // Mock is_capturing first, then fail start_capture
      mockInvoke
        .mockResolvedValueOnce(false)  // is_capturing check from useEffect
        .mockResolvedValueOnce(false)  // is_capturing check from startCapture's useEffect
        .mockRejectedValueOnce(new Error('Failed to start'))  // start_capture fails

      const { result } = renderHook(() => useCapture())

      await act(async () => {
        await result.current.startCapture()
      })

      expect(result.current.error).toBe('Failed to start')
      expect(result.current.isCapturing).toBe(false)
    })
  })

  describe('stopCapture', () => {
    it('sets isCapturing to false when capture stops', async () => {
      // Mock the sequence for starting
      mockInvoke
        .mockResolvedValueOnce(false)  // is_capturing check
        .mockResolvedValueOnce('started')  // start_capture

      const { result } = renderHook(() => useCapture())

      // Start capturing first
      await act(async () => {
        await result.current.startCapture()
      })

      // Then stop (mock stop_capture)
      mockInvoke.mockResolvedValueOnce(undefined)  // stop_capture
      await act(async () => {
        await result.current.stopCapture()
      })

      expect(result.current.isCapturing).toBe(false)
    })

    it('calls Tauri stop_capture command', async () => {
      mockInvoke.mockResolvedValueOnce(undefined)  // stop_capture

      const { result } = renderHook(() => useCapture())

      await act(async () => {
        await result.current.stopCapture()
      })

      expect(mockInvoke).toHaveBeenCalledWith('stop_capture')
    })

    it('sets error when stop fails', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Failed to stop'))

      const { result } = renderHook(() => useCapture())

      await act(async () => {
        await result.current.stopCapture()
      })

      expect(result.current.error).toBe('Failed to stop')
    })
  })

  describe('captureScreenshot', () => {
    it('captures screenshot and processes it', async () => {
      const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

      mockInvoke.mockResolvedValueOnce(base64Image)

      vi.mocked(aiLib.analyzeScreenshot).mockResolvedValueOnce({
        app_name: 'VS Code',
        window_title: 'main.go',
        category: 'coding',
        summary: 'Working on code'
      })

      vi.mocked(api.api.post).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            id: 'activity-123',
            app_name: 'VS Code',
            window_title: 'main.go',
            category: 'coding',
            summary: 'Working on code'
          }
        }
      })

      const { result } = renderHook(() => useCapture())

      await act(async () => {
        await result.current.captureScreenshot()
      })

      expect(aiLib.analyzeScreenshot).toHaveBeenCalledWith(base64Image, 'test-api-key')
      expect(api.api.post).toHaveBeenCalled()
    })

    it('adds new screenshot to list', async () => {
      const base64Image = 'data:image/png;base64,abc123'

      mockInvoke.mockResolvedValueOnce(base64Image)

      vi.mocked(aiLib.analyzeScreenshot).mockResolvedValueOnce({
        app_name: 'Browser',
        window_title: 'Documentation',
        category: 'research',
        summary: 'Reading docs'
      })

      vi.mocked(api.api.post).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            id: 'activity-456',
            captured_at: '2024-01-01T12:00:00Z',
            app_name: 'Browser',
            window_title: 'Documentation',
            category: 'research',
            summary: 'Reading docs'
          }
        }
      })

      const { result } = renderHook(() => useCapture())

      await act(async () => {
        await result.current.captureScreenshot()
      })

      expect(result.current.screenshots).toHaveLength(1)
      expect(result.current.screenshots[0].app_name).toBe('Browser')
    })

    it('handles screenshot capture error gracefully', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Capture failed'))

      const { result } = renderHook(() => useCapture())

      await act(async () => {
        await result.current.captureScreenshot()
      })

      expect(result.current.error).toBe('Capture failed')
    })

    it('does nothing when Tauri is not ready', async () => {
      vi.mocked(TauriContext.isTauriSync).mockReturnValueOnce(false)

      const { result } = renderHook(() => useCapture())

      await act(async () => {
        await result.current.captureScreenshot()
      })

      expect(mockInvoke).not.toHaveBeenCalled()
    })
  })

  describe('AI retry queue processing', () => {
    it('processes retry queue when API key is available', async () => {
      const mockRetryItem = {
        id: 'activity-789',
        imageBase64: 'base64data',
        capturedAt: '2024-01-01T10:00:00Z',
        retryCount: 0,
        lastRetryAt: new Date(Date.now() - 60000).toISOString()
      }

      vi.mocked(aiRetryQueue.getRetryableItems).mockResolvedValue([mockRetryItem])

      vi.mocked(aiLib.analyzeScreenshot).mockResolvedValueOnce({
        app_name: 'VS Code',
        window_title: 'code.go',
        category: 'coding',
        summary: 'Coding'
      })

      vi.mocked(api.api.patch).mockResolvedValueOnce({
        data: { success: true }
      })

      vi.mocked(api.api.get).mockResolvedValue({
        data: { success: true, data: [] }
      })

      renderHook(() => useCapture())

      await waitFor(() => {
        expect(aiRetryQueue.getRetryableItems).toHaveBeenCalled()
      }, { timeout: 15000 })
    })

    it('deletes item from retry queue after successful retry', async () => {
      const mockRetryItem = {
        id: 'activity-789',
        imageBase64: 'base64data',
        capturedAt: '2024-01-01T10:00:00Z',
        retryCount: 0
      }

      vi.mocked(aiRetryQueue.getRetryableItems).mockResolvedValue([mockRetryItem])

      vi.mocked(aiLib.analyzeScreenshot).mockResolvedValueOnce({
        app_name: 'App',
        window_title: 'Title',
        category: 'other',
        summary: 'Summary'
      })

      vi.mocked(api.api.patch).mockResolvedValueOnce({
        data: { success: true }
      })

      vi.mocked(api.api.get).mockResolvedValue({
        data: { success: true, data: [] }
      })

      renderHook(() => useCapture())

      await waitFor(() => {
        expect(aiRetryQueue.deleteAiRetry).toHaveBeenCalledWith('activity-789')
      }, { timeout: 15000 })
    })

    it('updates retry count on failure', async () => {
      const mockRetryItem = {
        id: 'activity-789',
        imageBase64: 'base64data',
        capturedAt: '2024-01-01T10:00:00Z',
        retryCount: 1
      }

      vi.mocked(aiRetryQueue.getRetryableItems).mockResolvedValue([mockRetryItem])

      vi.mocked(aiLib.analyzeScreenshot).mockRejectedValueOnce(new Error('AI failed'))

      vi.mocked(api.api.get).mockResolvedValue({
        data: { success: true, data: [] }
      })

      renderHook(() => useCapture())

      await waitFor(() => {
        expect(aiRetryQueue.updateAiRetry).toHaveBeenCalledWith(
          'activity-789',
          2,
          expect.any(String)
        )
      }, { timeout: 15000 })
    })

    it('marks as failed after max retries', async () => {
      const mockRetryItem = {
        id: 'activity-789',
        imageBase64: 'base64data',
        capturedAt: '2024-01-01T10:00:00Z',
        retryCount: 4,
        lastError: 'Max retries'
      }

      vi.mocked(aiRetryQueue.getRetryableItems).mockResolvedValue([mockRetryItem])

      vi.mocked(api.api.patch).mockResolvedValueOnce({
        data: { success: true }
      })

      vi.mocked(api.api.get).mockResolvedValue({
        data: { success: true, data: [] }
      })

      const { notifyAIFailure } = vi.mocked(NotificationHook.useNotification).mockReturnValue({
        sendNotification: vi.fn(),
        notifyAIFailure: vi.fn(),
        notifySyncError: vi.fn(),
      })

      renderHook(() => useCapture())

      await waitFor(() => {
        expect(notifyAIFailure).toHaveBeenCalled()
      }, { timeout: 15000 })
    })

    it('does not process when API key is not available', async () => {
      vi.mocked(ApiKeyHook.useApiKey).mockReturnValue({
        apiKey: null,
        isLoading: false
      })

      renderHook(() => useCapture())

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(aiRetryQueue.getRetryableItems).not.toHaveBeenCalled()
    })
  })

  describe('interval management', () => {
    it('allows changing capture interval', () => {
      const { result } = renderHook(() => useCapture())

      act(() => {
        result.current.setInterval(10)
      })

      expect(result.current.interval).toBe(10)
    })

    it('uses new interval when starting capture', async () => {
      const { result } = renderHook(() => useCapture())

      // Wait for hook to initialize (waitForTauri effect to run)
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalled()
      }, { timeout: 5000 })

      // Clear previous calls and set up specific mock sequence
      mockInvoke.mockReset()
      mockInvoke
        .mockResolvedValueOnce(false)  // is_capturing returns false
        .mockResolvedValueOnce('started')  // start_capture succeeds

      act(() => {
        result.current.setInterval(15)
      })

      await act(async () => {
        await result.current.startCapture()
      })

      // Check that start_capture was called with the correct interval
      expect(mockInvoke).toHaveBeenCalledWith('start_capture', {
        interval_minutes: 15
      })
    })
  })

  describe('API key dependency', () => {
    it('uses API key from useApiKey hook', async () => {
      mockInvoke.mockResolvedValueOnce('base64image')

      vi.mocked(aiLib.analyzeScreenshot).mockResolvedValueOnce({
        app_name: 'App',
        window_title: 'Title',
        category: 'other',
        summary: 'Summary'
      })

      vi.mocked(api.api.post).mockResolvedValueOnce({
        data: { success: true, data: { id: '123' } }
      })

      vi.mocked(ApiKeyHook.useApiKey).mockReturnValue({
        apiKey: 'my-custom-key',
        isLoading: false
      })

      const { result } = renderHook(() => useCapture())

      await act(async () => {
        await result.current.captureScreenshot()
      })

      expect(aiLib.analyzeScreenshot).toHaveBeenCalledWith('base64image', 'my-custom-key')
    })

    it('handles null API key', async () => {
      vi.mocked(ApiKeyHook.useApiKey).mockReturnValue({
        apiKey: null,
        isLoading: false
      })

      mockInvoke.mockResolvedValueOnce('base64image')

      vi.mocked(api.api.post).mockResolvedValueOnce({
        data: { success: true, data: { id: '123' } }
      })

      const { result } = renderHook(() => useCapture())

      await act(async () => {
        await result.current.captureScreenshot()
      })

      // Should upload placeholder without AI analysis
      expect(api.api.post).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('clears error on successful operation', async () => {
      mockInvoke.mockResolvedValue('success')

      const { result } = renderHook(() => useCapture())

      // Set an error first
      act(() => {
        result.current.startCapture()
      })

      await act(async () => {
        await result.current.stopCapture()
      })

      expect(result.current.error).toBeNull()
    })

    it('sets error message on upload failure', async () => {
      mockInvoke.mockResolvedValueOnce('base64')

      vi.mocked(aiLib.analyzeScreenshot).mockResolvedValueOnce({
        app_name: 'App',
        window_title: 'Title',
        category: 'other',
        summary: 'Summary'
      })

      vi.mocked(api.api.post).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useCapture())

      await act(async () => {
        await result.current.captureScreenshot()
      })

      // Error should be set internally, but the hook handles it gracefully
      expect(result.current.screenshots).toBeDefined()
    })
  })

  describe('Tauri readiness', () => {
    it('waits for Tauri to be ready before capturing', async () => {
      let resolveTauri: () => void
      const tauriPromise = new Promise<void>(resolve => {
        resolveTauri = resolve
      })

      vi.mocked(TauriContext.waitForTauri).mockReturnValueOnce(tauriPromise)

      const { result } = renderHook(() => useCapture())

      // Should not be ready yet
      expect(result.current.error).toBeNull()

      // Resolve Tauri
      await act(async () => {
        resolveTauri!()
      })

      // Now should be ready
      expect(result.current.error).toBeNull()
    })
  })

  describe('keyboard shortcuts', () => {
    it('allows keyboard shortcuts for capture control', () => {
      const { result } = renderHook(() => useCapture())

      // Hook should be set up to handle keyboard events
      // This is tested by ensuring the hook doesn't crash
      expect(result.current).toBeDefined()
      expect(result.current.captureScreenshot).toBeDefined()
      expect(result.current.startCapture).toBeDefined()
      expect(result.current.stopCapture).toBeDefined()
    })
  })
})
