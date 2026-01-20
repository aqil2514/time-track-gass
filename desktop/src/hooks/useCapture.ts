import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import type { Screenshot } from '../types'

export function useCapture() {
    const [screenshots, setScreenshots] = useState<Screenshot[]>([])
    const [isCapturing, setIsCapturing] = useState(false)
    const [interval, setInterval] = useState(5) // minutes
    const [error, setError] = useState<string | null>(null)

    const captureScreenshot = async () => {
        try {
            setError(null)
            const base64 = await invoke<string>('capture_screenshot')
            const screenshot: Screenshot = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                data: base64,
            }
            setScreenshots((prev) => [screenshot, ...prev])
        } catch (e) {
            setError(String(e))
        }
    }

    const startCapture = async () => {
        try {
            setError(null)
            await invoke('start_capture', { intervalMinutes: interval })
            setIsCapturing(true)
        } catch (e) {
            setError(String(e))
        }
    }

    const stopCapture = async () => {
        try {
            setError(null)
            await invoke('stop_capture')
            setIsCapturing(false)
        } catch (e) {
            setError(String(e))
        }
    }

    useEffect(() => {
        let unlisten: (() => void) | undefined

        const setupListener = async () => {
            try {
                // @ts-ignore - types might be missing for now
                const { listen } = await import('@tauri-apps/api/event')
                unlisten = await listen<string>('screenshot-captured', (event) => {
                    const screenshot: Screenshot = {
                        id: Date.now().toString(),
                        timestamp: new Date().toISOString(),
                        data: event.payload,
                    }
                    setScreenshots((prev) => [screenshot, ...prev])
                })
            } catch (e) {
                console.error("Failed to setup listener", e)
            }
        }

        setupListener()

        return () => {
            if (unlisten) unlisten()
        }
    }, [])

    // Effect to clean up on unmount or if window is closed (optional/Tauri specific lifecycle)
    // For now, we rely on the backend state, but we could sync it here.

    return {
        screenshots,
        isCapturing,
        interval,
        setInterval,
        error,
        captureScreenshot,
        startCapture,
        stopCapture
    }
}
