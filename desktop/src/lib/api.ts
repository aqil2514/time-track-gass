import { invoke } from '@tauri-apps/api/core'
import type { Screenshot, CaptureSettings } from '../types'

export async function captureScreenshot(): Promise<string> {
  return await invoke<string>('capture_screenshot')
}

export async function startCapture(intervalMinutes: number): Promise<void> {
  await invoke('start_capture', { intervalMinutes })
}

export async function stopCapture(): Promise<void> {
  await invoke('stop_capture')
}

export async function isCapturing(): Promise<boolean> {
  return await invoke<boolean>('is_capturing')
}

export async function getCaptureInterval(): Promise<number> {
  return await invoke<number>('get_capture_interval')
}

export async function uploadScreenshot(base64Data: string, timestamp: string): Promise<void> {
  // TODO: Implement API upload to backend
  console.log('Uploading screenshot...', timestamp)
}
