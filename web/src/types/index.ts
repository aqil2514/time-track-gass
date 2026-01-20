export interface User {
  id: string
  email: string
  name?: string
  created_at: string
}

export interface Activity {
  id: string
  user_id: string
  captured_at: string
  app_name: string
  window_title: string
  category: Category
  summary: string
  created_at: string
}

export type Category = 'coding' | 'meeting' | 'browsing' | 'communication' | 'design' | 'other'

export interface ActivityStats {
  total_minutes: number
  total_hours: number
  by_category: Record<string, CategoryStat>
}

export interface CategoryStat {
  minutes: number
  percentage: number
  count: number
}

export interface Share {
  id: string
  owner_id: string
  viewer_id: string
  created_at: string
  user?: User
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  meta?: {
    page: number
    per_page: number
    total: number
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name?: string
}

export interface LoginResponse {
  user: User
  token: string
}
