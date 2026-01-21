import { ApiError, UnauthorizedError, ValidationError, NotFoundError } from './errors'

const API_BASE = 'http://localhost:8080/api/v1'

class ApiClient {
  private token: string | null = null

  setToken(token: string) {
    this.token = token
    localStorage.setItem('token', token)
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token')
    }
    return this.token
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('token')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      // Map HTTP status codes to appropriate error types
      switch (response.status) {
        case 401:
          throw new UnauthorizedError(data.error?.message || 'Unauthorized')
        case 403:
          throw new ApiError(data.error?.message || 'Forbidden', 403, data.error?.code)
        case 404:
          throw new NotFoundError(data.error?.message || 'Not found')
        case 409:
          throw new ApiError(data.error?.message || 'Conflict', 409, data.error?.code)
        case 400:
          throw new ValidationError(data.error?.message || 'Validation error')
        default:
          throw new ApiError(
            data.error?.message || 'Request failed',
            response.status,
            data.error?.code
          )
      }
    }

    return data
  }

  // Auth
  async register(data: { email: string; password: string; name?: string }) {
    return this.request<{ data: import('../types').User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async login(data: { email: string; password: string }) {
    const response = await this.request<{ data: import('../types').LoginResponse }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (response.data.token) {
      this.setToken(response.data.token)
    }
    return response
  }

  async logout() {
    const response = await this.request('/auth/logout', { method: 'POST' })
    this.clearToken()
    return response
  }

  async getMe() {
    return this.request<{ data: import('../types').User }>('/auth/me')
  }

  // Activities
  async getActivities(params?: { from?: string; to?: string; category?: string; page?: number; per_page?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.from) searchParams.set('from', params.from)
    if (params?.to) searchParams.set('to', params.to)
    if (params?.category) searchParams.set('category', params.category)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.per_page) searchParams.set('per_page', params.per_page.toString())

    const query = searchParams.toString()
    return this.request<{ data: import('../types').Activity[]; meta: { total: number } }>(
      `/activity${query ? `?${query}` : ''}`
    )
  }

  async getStats(from?: string, to?: string) {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)

    const query = params.toString()
    return this.request<{ data: import('../types').ActivityStats }>(
      `/activity/stats${query ? `?${query}` : ''}`
    )
  }

  async uploadActivity(image: string, capturedAt?: string) {
    return this.request<{ data: import('../types').Activity }>('/activity/upload', {
      method: 'POST',
      body: JSON.stringify({ image, captured_at: capturedAt }),
    })
  }

  // Shares
  async createShare(email: string) {
    return this.request<{ data: import('../types').Share }>('/share', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async getViewers() {
    return this.request<{ data: import('../types').Share[] }>('/share/viewers')
  }

  async getWatching() {
    return this.request<{ data: import('../types').Share[] }>('/share/watching')
  }

  async deleteShare(shareId: string) {
    return this.request(`/share/${shareId}`, { method: 'DELETE' })
  }

  // Share Links
  async createShareLink(data: { name: string; expires_at?: string; is_public?: boolean }) {
    return this.request<{ data: any }>('/share/link', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getShareLinks() {
    return this.request<{ data: any[] }>('/share/link')
  }

  async deleteShareLink(id: string) {
    return this.request(`/share/link/${id}`, { method: 'DELETE' })
  }

  async getPublicStats(slug: string) {
    return this.request<{ data: any }>(`/s/${slug}`)
  }

  // Supervisor
  async getUserActivity(userId: string, params?: { from?: string; to?: string; category?: string; page?: number; per_page?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.from) searchParams.set('from', params.from)
    if (params?.to) searchParams.set('to', params.to)
    if (params?.category) searchParams.set('category', params.category)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.per_page) searchParams.set('per_page', params.per_page.toString())

    const query = searchParams.toString()
    return this.request<{ data: import('../types').Activity[] }>(
      `/supervise/${userId}/activity${query ? `?${query}` : ''}`
    )
  }

  async getUserStats(userId: string, from?: string, to?: string) {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)

    const query = params.toString()
    return this.request<{ data: import('../types').ActivityStats }>(
      `/supervise/${userId}/stats${query ? `?${query}` : ''}`
    )
  }
}

export const apiClient = new ApiClient()
