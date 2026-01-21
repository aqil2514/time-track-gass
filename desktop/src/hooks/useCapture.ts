import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import type { Screenshot } from '../types'
import { logger } from '../lib/logger'
import { api } from '../lib/api'

export function useCapture() {
    const [screenshots, setScreenshots] = useState<Screenshot[]>([])
    const [isCapturing, setIsCapturing] = useState(false)
    const [interval, setInterval] = useState(5) // minutes
    const [error, setError] = useState<string | null>(null)

    // Fetch activities from backend
    const fetchActivities = useCallback(async () => {
        try {
            const today = new Date().toISOString().split('T')[0]
            const response = await api.get('/activity', {
                params: {
                    from: today,
                    per_page: 50
                }
            })
            if (response.data.success) {
                setScreenshots(response.data.data)
            }
        } catch (e: any) {
            logger.error("Failed to fetch activities", e)
        }
    }, [])

    // Upload screenshot to backend
    const uploadScreenshot = async (base64Data: string): Promise<Screenshot | null> => {
        const token = localStorage.getItem('token');
        if (!token) {
            logger.warn("Skipping upload: No auth token found");
            return null;
        }

        try {
            logger.info("Uploading screenshot...");
            const response = await api.post('/activity/upload', {
                image: base64Data,
                captured_at: new Date().toISOString()
            });
            logger.info("Screenshot uploaded successfully");
            return response.data.data;
        } catch (e: any) {
            logger.error("Failed to upload screenshot", {
                error: e.message,
                status: e.response?.status,
                detail: e.response?.data
            });
            if (e.response?.status === 401 || e.response?.status === 403) {
                // Stop capturing if auth fails
                logger.warn("Stopping capture due to auth failure");
                await stopCapture();
            }
            throw e;
        }
    };

    const captureScreenshot = useCallback(async () => {
        try {
            setError(null)
            const base64 = await invoke<string>('capture_screenshot')

            // Upload and get back activity metadata
            const activity = await uploadScreenshot(base64);
            if (activity) {
                setScreenshots((prev) => [activity, ...prev])
            }
        } catch (e) {
            setError(String(e))
        }
    }, [])

    const startCapture = useCallback(async () => {
        try {
            setError(null)
            await invoke('start_capture', { intervalMinutes: interval })
            setIsCapturing(true)
        } catch (e) {
            setError(String(e))
        }
    }, [interval])

    const stopCapture = useCallback(async () => {
        try {
            setError(null)
            await invoke('stop_capture')
            setIsCapturing(false)
        } catch (e) {
            setError(String(e))
        }
    }, [])

    // Fetch activities on mount
    useEffect(() => {
        fetchActivities()
    }, [fetchActivities])

    // Event Listener & Initial State Sync
    useEffect(() => {
        let unlisten: (() => void) | undefined

        const setupListener = async () => {
            try {
                // Sync initial state
                try {
                    const running = await invoke<boolean>('is_capturing')
                    setIsCapturing(running)
                } catch (e) {
                    logger.error("Failed to sync capture state", e)
                }

                // @ts-ignore - types might be missing for now
                const { listen } = await import('@tauri-apps/api/event')
                unlisten = await listen<string>('screenshot-captured', async (event) => {
                    const base64 = event.payload;

                    // Upload and get back activity metadata (base64 discarded after upload)
                    try {
                        const activity = await uploadScreenshot(base64);
                        if (activity) {
                            setScreenshots((prev) => [activity, ...prev])
                        }
                    } catch (e) {
                        console.error("Auto-upload failed", e);
                    }
                })
            } catch (e) {
                logger.error("Failed to setup event listener", e)
            }
        }

        setupListener()

        return () => {
            if (unlisten) unlisten()
        }
    }, [])

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for Ctrl+Shift (or Command+Shift on Mac if needed, but Windows specific for now)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
                switch (e.key.toLowerCase()) {
                    case 's':
                        e.preventDefault()
                        if (isCapturing) {
                            stopCapture()
                        } else {
                            startCapture()
                        }
                        break
                    case 'c':
                        e.preventDefault()
                        captureScreenshot()
                        break
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isCapturing, interval, startCapture, stopCapture, captureScreenshot])

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
