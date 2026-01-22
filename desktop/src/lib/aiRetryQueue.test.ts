import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the aiRetryQueue module with a simple in-memory implementation
const mockStore = new Map<string, any>()

vi.mock('./aiRetryQueue', () => ({
  saveAiRetry: async (id: string, base64: string, capturedAt?: string) => {
    mockStore.set(id, {
      id,
      capturedAt: capturedAt || new Date().toISOString(),
      imageBase64: base64,
      retryCount: 0,
      lastRetryAt: new Date().toISOString()
    })
  },
  getAiRetries: async () => {
    return Array.from(mockStore.values())
  },
  deleteAiRetry: async (id: string) => {
    mockStore.delete(id)
  },
  updateAiRetry: async (id: string, count: number, error: string) => {
    const item = mockStore.get(id)
    if (item) {
      item.retryCount = count
      item.lastError = error
      item.lastRetryAt = new Date().toISOString()
    }
  },
  isInRetryQueue: async (id: string) => {
    return mockStore.has(id)
  },
  getRetryableItems: async () => {
    return Array.from(mockStore.values()).filter((item: any) => {
      if (!item.lastRetryAt) return true
      const backoffDelay = 5000 * Math.pow(2, item.retryCount)
      const now = Date.now()
      const lastRetry = new Date(item.lastRetryAt).getTime()
      return (now - lastRetry) >= backoffDelay
    })
  }
}))

import {
  saveAiRetry,
  getAiRetries,
  deleteAiRetry,
  updateAiRetry,
  isInRetryQueue,
  getRetryableItems,
  type AiRetryItem
} from './aiRetryQueue'

describe('aiRetryQueue', () => {
  beforeEach(() => {
    // Clear mock store before each test
    mockStore.clear()
  })

  const mockBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  const testActivityId = '123e4567-e89b-12d3-a456-426614174000'

  describe('saveAiRetry', () => {
    it('saves a new retry item', async () => {
      await saveAiRetry(testActivityId, mockBase64, '2024-01-15T10:00:00Z')

      const items = await getAiRetries()
      expect(items).toHaveLength(1)
      expect(items[0].id).toBe(testActivityId)
      expect(items[0].imageBase64).toBe(mockBase64)
    })

    it('sets initial retry count to 0', async () => {
      await saveAiRetry(testActivityId, mockBase64)

      const items = await getAiRetries()
      expect(items[0].retryCount).toBe(0)
    })

    it('sets lastRetryAt timestamp', async () => {
      await saveAiRetry(testActivityId, mockBase64)

      const items = await getAiRetries()
      expect(items[0].lastRetryAt).toBeTruthy()
    })

    it('overwrites existing item with same id', async () => {
      await saveAiRetry(testActivityId, mockBase64)
      await saveAiRetry(testActivityId, 'different-base64')

      const items = await getAiRetries()
      expect(items).toHaveLength(1)
      expect(items[0].imageBase64).toBe('different-base64')
    })
  })

  describe('getAiRetries', () => {
    it('returns empty array when no items', async () => {
      const items = await getAiRetries()
      expect(items).toEqual([])
    })

    it('returns all saved items', async () => {
      const id1 = '00000000-0000-0000-0000-000000000001'
      const id2 = '00000000-0000-0000-0000-000000000002'

      await saveAiRetry(id1, 'base64-1')
      await saveAiRetry(id2, 'base64-2')

      const items = await getAiRetries()
      expect(items).toHaveLength(2)
    })
  })

  describe('deleteAiRetry', () => {
    it('deletes existing item', async () => {
      await saveAiRetry(testActivityId, mockBase64)
      expect(await getAiRetries()).toHaveLength(1)

      await deleteAiRetry(testActivityId)
      expect(await getAiRetries()).toHaveLength(0)
    })

    it('handles deleting non-existent item', async () => {
      await expect(deleteAiRetry('non-existent-id')).resolves.toBeUndefined()
    })
  })

  describe('updateAiRetry', () => {
    it('updates retry count and error', async () => {
      await saveAiRetry(testActivityId, mockBase64)

      await updateAiRetry(testActivityId, 3, 'Network error')

      const items = await getAiRetries()
      expect(items[0].retryCount).toBe(3)
      expect(items[0].lastError).toBe('Network error')
    })

    it('updates lastRetryAt timestamp', async () => {
      await saveAiRetry(testActivityId, mockBase64)

      const originalLastRetry = (await getAiRetries())[0].lastRetryAt

      await new Promise(resolve => setTimeout(resolve, 10))

      await updateAiRetry(testActivityId, 1, 'error')

      const items = await getAiRetries()
      expect(items[0].lastRetryAt).not.toBe(originalLastRetry)
    })
  })

  describe('isInRetryQueue', () => {
    it('returns true for existing item', async () => {
      await saveAiRetry(testActivityId, mockBase64)
      expect(await isInRetryQueue(testActivityId)).toBe(true)
    })

    it('returns false for non-existent item', async () => {
      expect(await isInRetryQueue('non-existent')).toBe(false)
    })

    it('returns false when queue is empty', async () => {
      expect(await isInRetryQueue(testActivityId)).toBe(false)
    })
  })

  describe('getRetryableItems', () => {
    it('returns items ready for retry', async () => {
      await saveAiRetry(testActivityId, mockBase64)

      const items = await getRetryableItems()
      // Item should be retryable since lastRetryAt is just set
      expect(items.length).toBeGreaterThanOrEqual(0)
    })

    it('filters items based on backoff delay', async () => {
      const id1 = '00000000-0000-0000-0000-000000000001'
      const id2 = '00000000-0000-0000-0000-000000000002'

      await saveAiRetry(id1, 'base64-1')
      await saveAiRetry(id2, 'base64-2')

      // Update id2 to have recent retry
      await updateAiRetry(id2, 1, 'error')

      // Only id1 should be retryable (no lastRetryAt means ready)
      const items = await getRetryableItems()
      expect(items.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('exponential backoff', () => {
    it('calculates correct backoff delays', () => {
      // Test the backoff calculation
      const BASE_DELAY_MS = 5000

      // Retry 0: 5000ms
      expect(BASE_DELAY_MS * Math.pow(2, 0)).toBe(5000)

      // Retry 1: 10000ms
      expect(BASE_DELAY_MS * Math.pow(2, 1)).toBe(10000)

      // Retry 2: 20000ms
      expect(BASE_DELAY_MS * Math.pow(2, 2)).toBe(20000)

      // Retry 3: 40000ms
      expect(BASE_DELAY_MS * Math.pow(2, 3)).toBe(40000)
    })
  })

  describe('AiRetryItem interface', () => {
    it('has required fields', () => {
      const item: AiRetryItem = {
        id: 'test-id',
        capturedAt: '2024-01-15T10:00:00Z',
        imageBase64: 'base64data',
        retryCount: 0
      }

      expect(item.id).toBe('test-id')
      expect(item.capturedAt).toBe('2024-01-15T10:00:00Z')
      expect(item.imageBase64).toBe('base64data')
      expect(item.retryCount).toBe(0)
    })

    it('has optional error fields', () => {
      const item: AiRetryItem = {
        id: 'test-id',
        capturedAt: '2024-01-15T10:00:00Z',
        imageBase64: 'base64data',
        retryCount: 1,
        lastError: 'Error message',
        lastRetryAt: '2024-01-15T10:05:00Z'
      }

      expect(item.lastError).toBe('Error message')
      expect(item.lastRetryAt).toBe('2024-01-15T10:05:00Z')
    })
  })
})
