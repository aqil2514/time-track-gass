// desktop/src/test/setup.ts
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi, beforeEach } from 'vitest'
import { TextEncoder, TextDecoder } from 'util'

// Cleanup after each test
afterEach(() => {
  cleanup()
  localStorage.clear()
})

// Setup for each test
beforeEach(() => {
  vi.clearAllMocks()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock IndexedDB for aiRetryQueue tests
const mockDBStore = new Map<string, any>()

class MockObjectStore {
  constructor(private name: string) {}

  put(item: any) {
    mockDBStore.set(item.id || item.key, item)
    return this as any // Return mock request
  }

  get(key: string) {
    const result = {
      result: mockDBStore.get(key),
      onsuccess: null as any,
      onerror: null as any,
    }
    // Simulate async behavior
    setTimeout(() => result.onsuccess?.({ target: result }), 0)
    return result
  }

  delete(key: string) {
    mockDBStore.delete(key)
    return this as any
  }

  getAll() {
    const result = {
      result: Array.from(mockDBStore.values()),
      onsuccess: null as any,
      onerror: null as any,
    }
    setTimeout(() => result.onsuccess?.({ target: result }), 0)
    return result
  }
}

class MockTransaction {
  constructor(
    private storeName: string,
    private mode: string
  ) {
    this.objectStore = new MockObjectStore(storeName)
  }

  objectStore: any
  oncomplete: any = null
  onerror: any = null

  // Simulate async completion
  _complete() {
    setTimeout(() => this.oncomplete?.(), 0)
  }
}

class MockDB {
  constructor(
    public name: string,
    public version: number
  ) {
    // Initialize with test data
    setTimeout(() => {
      const event = { target: { result: this } } as any
      // @ts-ignore - trigger onupgradeneeded simulation
      this._onupgradeneeded?.(event)
    }, 0)
  }

  private _stores = new Map<string, MockObjectStore>()
  objectStoreNames = {
    contains: (name: string) => name === 'retryQueue',
  }

  _onupgradeneeded: any = null

  transaction(storeName: string, mode: string) {
    return new MockTransaction(storeName, mode)
  }

  close() {}
}

const openDatabaseMock = vi.fn((name: string, version: number) => {
  const request = {
    result: new MockDB(name, version),
    onsuccess: null as any,
    onerror: null as any,
    onupgradeneeded: null as any,
  }

  // Trigger success callback
  setTimeout(() => {
    if (request.onsuccess) {
      request.onsuccess({ target: request } as any)
    }
  }, 0)

  return request
})

Object.defineProperty(window, 'indexedDB', {
  value: {
    open: openDatabaseMock,
    deleteDatabase: vi.fn(() => {
      const request = {
        onsuccess: null as any,
        onerror: null as any,
      }
      setTimeout(() => request.onsuccess?.(), 0)
      mockDBStore.clear()
      return request
    }),
  },
})

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => ({
    unlisten: vi.fn(),
  })),
}))

