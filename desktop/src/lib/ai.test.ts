// desktop/src/lib/ai.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyzeScreenshot, AnalysisResult } from './ai'

// Mock global fetch - use named mock for proper type casting
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock logger
vi.mock('./logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('ai', () => {
  const testApiKey = 'test-api-key-12345'
  const testBase64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

  beforeEach(() => {
    vi.clearAllMocks()
    // Re-apply the global fetch mock after restoreAllMocks()
    global.fetch = mockFetch
    // Set default mock behavior
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: '{"app_name": "App", "window_title": "Title", "category": "other", "summary": "Test"}'
          }
        }]
      }),
    } as Response)
  })

  describe('analyzeScreenshot', () => {
    it('calls AI API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                app_name: 'VS Code',
                window_title: 'main.go - TimeTrack',
                category: 'coding',
                summary: 'Working on Go backend'
              })
            }
          }]
        }),
      } as Response)

      const result = await analyzeScreenshot(testBase64Image, testApiKey)

      expect(fetch).toHaveBeenCalledWith(
        'https://open.bigmodel.cn/api/coding/paas/v4/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testApiKey}`
          }
        })
      )
    })

    it('parses JSON response correctly', async () => {
      const mockResponse = {
        app_name: 'VS Code',
        window_title: 'main.go - TimeTrack',
        category: 'coding',
        summary: 'Working on Go backend'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify(mockResponse)
            }
          }]
        }),
      } as Response)

      const result = await analyzeScreenshot(testBase64Image, testApiKey)

      expect(result).toEqual(mockResponse)
    })

    it('strips markdown code blocks from response', async () => {
      const contentWithMarkdown = '```json\n{"app_name": "VS Code", "window_title": "test.ts", "category": "coding", "summary": "Testing"}\n```'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: contentWithMarkdown
            }
          }]
        }),
      } as Response)

      const result = await analyzeScreenshot(testBase64Image, testApiKey)

      expect(result.app_name).toBe('VS Code')
    })

    it('handles raw base64 image (without data URI prefix)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: '{"app_name": "App", "window_title": "Title", "category": "other", "summary": "Test"}'
            }
          }]
        }),
      } as Response)

      const rawBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
      await analyzeScreenshot(rawBase64, testApiKey)

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('data:image/png;base64,')
        })
      )
    })

    it('handles image with existing data URI prefix', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: '{"app_name": "App", "window_title": "Title", "category": "other", "summary": "Test"}'
            }
          }]
        }),
      } as Response)

      const dataUriImage = `data:image/webp;base64,${testBase64Image}`
      await analyzeScreenshot(dataUriImage, testApiKey)

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining(dataUriImage)
        })
      )
    })
  })

  describe('error handling', () => {
    it('handles API timeout error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Fetch timeout'))

      await expect(analyzeScreenshot(testBase64Image, testApiKey)).rejects.toThrow('Fetch timeout')
    })

    it('handles API error response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      } as Response)

      await expect(analyzeScreenshot(testBase64Image, testApiKey)).rejects.toThrow()
      await expect(analyzeScreenshot(testBase64Image, testApiKey)).rejects.toThrow('401')
    })

    it('handles rate limiting (429)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded'
      } as Response)

      await expect(analyzeScreenshot(testBase64Image, testApiKey)).rejects.toThrow()
    })

    it('handles invalid JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'This is not valid JSON'
            }
          }]
        }),
      } as Response)

      const result = await analyzeScreenshot(testBase64Image, testApiKey)

      // Should return fallback result
      expect(result.app_name).toBe('Unknown')
      expect(result.category).toBe('other')
      expect(result.summary).toBe('This is not valid JSON'.slice(0, 200))
    })

    it('handles malformed response without choices', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: 'invalid format'
        }),
      } as Response)

      await expect(analyzeScreenshot(testBase64Image, testApiKey)).rejects.toThrow('Invalid AI response format')
    })

    it('handles empty response content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: ''
            }
          }]
        }),
      } as Response)

      const result = await analyzeScreenshot(testBase64Image, testApiKey)

      expect(result.app_name).toBe('Unknown')
    })

    it('handles network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(analyzeScreenshot(testBase64Image, testApiKey)).rejects.toThrow('Network error')
    })
  })

  describe('request format', () => {
    it('includes correct model in request body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: { content: '{"app_name": "App", "window_title": "Title", "category": "other", "summary": "Test"}' }
          }]
        }),
      } as Response)

      await analyzeScreenshot(testBase64Image, testApiKey)

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)

      expect(body.model).toBe('glm-4.6v')
    })

    it('includes both image and text in content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: { content: '{"app_name": "App", "window_title": "Title", "category": "other", "summary": "Test"}' }
          }]
        }),
      } as Response)

      await analyzeScreenshot(testBase64Image, testApiKey)

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)

      expect(body.messages).toHaveLength(1)
      expect(body.messages[0].role).toBe('user')
      expect(body.messages[0].content).toHaveLength(2)

      const contentItems = body.messages[0].content
      expect(contentItems[0]).toHaveProperty('type', 'image_url')
      expect(contentItems[0].image_url).toHaveProperty('url')
      expect(contentItems[1]).toHaveProperty('type', 'text')
      expect(contentItems[1].text).toContain('Extract activity context')
    })

    it('includes detailed prompt for activity analysis', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: { content: '{"app_name": "VS Code", "window_title": "main.go", "category": "coding", "summary": "Coding"}' }
          }]
        }),
      } as Response)

      await analyzeScreenshot(testBase64Image, testApiKey)

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      const textContent = body.messages[0].content.find((c: any) => c.type === 'text')

      expect(textContent.text).toContain('App/Tool')
      expect(textContent.text).toContain('category')
      expect(textContent.text).toContain('coding')
      expect(textContent.text).toContain('debugging')
      expect(textContent.text).toContain('JSON output')
    })
  })

  describe('response parsing', () => {
    it('handles all standard categories', async () => {
      const categories = ['coding', 'debugging', 'research', 'database', 'devops', 'review', 'meeting', 'communication', 'design', 'planning', 'other']

      for (const category of categories) {
        const mockResponse = {
          app_name: 'App',
          window_title: 'Title',
          category: category,
          summary: 'Test summary'
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                content: JSON.stringify(mockResponse)
              }
            }]
          }),
        } as Response)

        const result = await analyzeScreenshot(testBase64Image, testApiKey)
        expect(result.category).toBe(category)
      }
    })

    it('handles long summary text', async () => {
      const longSummary = 'A'.repeat(300)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                app_name: 'App',
                window_title: 'Title',
                category: 'other',
                summary: longSummary
              })
            }
          }]
        }),
      } as Response)

      const result = await analyzeScreenshot(testBase64Image, testApiKey)
      expect(result.summary).toBe(longSummary)
    })

    it('handles special characters in app names', async () => {
      const specialNames = [
        'Visual Studio Code',
        'Google Chrome',
        'Slack - Workspace',
        'Docker Desktop',
        'Postman (8)'
      ]

      for (const appName of specialNames) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                content: JSON.stringify({
                  app_name: appName,
                  window_title: 'Test',
                  category: 'other',
                  summary: 'Test'
                })
              }
            }]
          }),
        } as Response)

        const result = await analyzeScreenshot(testBase64Image, testApiKey)
        expect(result.app_name).toBe(appName)
      }
    })
  })

  describe('fallback behavior', () => {
    it('uses truncated content when JSON parsing fails', async () => {
      const logger = await import('./logger')
      const invalidJson = 'This is a long text response that cannot be parsed as JSON but should be handled gracefully'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: invalidJson
            }
          }]
        }),
      } as Response)

      const result = await analyzeScreenshot(testBase64Image, testApiKey)

      expect(result.app_name).toBe('Unknown')
      expect(result.summary).toBe(invalidJson.slice(0, 200))
      expect(logger.logger.warn).toHaveBeenCalledWith(
        'Failed to parse AI JSON response, using raw content',
        invalidJson
      )
    })

    it('handles very long non-JSON response', async () => {
      const veryLongText = 'A'.repeat(500)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: veryLongText
            }
          }]
        }),
      } as Response)

      const result = await analyzeScreenshot(testBase64Image, testApiKey)

      expect(result.summary).toBe(veryLongText.slice(0, 200))
      expect(result.summary.length).toBe(200)
    })
  })

  describe('AnalysisResult interface', () => {
    it('returns valid AnalysisResult structure', async () => {
      const expected: AnalysisResult = {
        app_name: 'VS Code',
        window_title: 'main.go',
        category: 'coding',
        summary: 'Working on code'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify(expected)
            }
          }]
        }),
      } as Response)

      const result = await analyzeScreenshot(testBase64Image, testApiKey)

      expect(result).toHaveProperty('app_name')
      expect(result).toHaveProperty('window_title')
      expect(result).toHaveProperty('category')
      expect(result).toHaveProperty('summary')
      expect(typeof result.app_name).toBe('string')
      expect(typeof result.window_title).toBe('string')
      expect(typeof result.category).toBe('string')
      expect(typeof result.summary).toBe('string')
    })
  })
})
