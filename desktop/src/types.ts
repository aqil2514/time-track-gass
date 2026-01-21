export interface Activity {
  id: string
  captured_at: string
  app_name: string
  window_title: string
  category: string
  summary: string
}

export type Screenshot = Activity

export interface CaptureSettings {
  intervalMinutes: number
  quality: number
  enabled: boolean
}

export interface AppSettings {
  apiUrl: string
  apiKey: string
  capture: CaptureSettings
}
