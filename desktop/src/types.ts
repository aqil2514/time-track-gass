export interface Screenshot {
  id: string
  timestamp: string
  data: string
  activityId?: string
}

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
