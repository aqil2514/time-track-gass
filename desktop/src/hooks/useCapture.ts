import { useState, useEffect, useCallback } from 'react'
import type { Screenshot } from '../types'
import { logger } from '../lib/logger'
import { api } from '../lib/api'
import { isTauriSync, waitForTauri } from '../lib/tauri'
import { useAuth } from '../context/AuthContext'

async function safeInvoke<T>(command: string, args?: any): Promise<T> {
    if (!isTauriSync()) {
        throw new Error('Tauri API is not available in browser environment')
    }
    try {
        const { invoke } = await import('@tauri-apps/api/core')
        const result = await invoke<T>(command, args)
        logger.info(`Tauri command '${command}' succeeded`, { args, result })
        return result
    } catch (e: any) {
        logger.error(`Tauri command '${command}' failed`, {
            command,
            args,
            error: e?.message || e?.toString() || e
        })
        throw e
    }
}

export function useCapture() {
    const { user } = useAuth()
    const [screenshots, setScreenshots] = useState<Screenshot[]>([])
    const [isCapturing, setIsCapturing] = useState(false)
    const [interval, setInterval] = useState(5) // minutes
    const [error, setError] = useState<string | null>(null)
    const [isTauriReady, setIsTauriReady] = useState(false)

    // Initialize Tauri detection
    useEffect(() => {
        waitForTauri().then(setIsTauriReady)
    }, [])

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
                setScreenshots(response.data.data || [])
            }
        } catch (e: any) {
            // Don't show error if it's just a network issue or backend not running
            if (e.response?.status !== 500) {
                logger.error("Failed to fetch activities", e)
            }
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

            // If upload fails and we are in Tauri, save to offline queue
            if (isTauriSync() && user) {
                try {
                    logger.info("Saving screenshot to offline queue...");
                    await safeInvoke('save_offline_screenshot', {
                        user_id: user.id,
                        image_b64: base64Data
                    });
                    logger.info("Saved to offline queue successfully");
                } catch (saveError) {
                    logger.error("Failed to save to offline queue", saveError);
                }
            }

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
            if (!isTauriReady) {
                logger.warn('Screenshot capture is only available in Tauri desktop app')
                return
            }
            const base64 = await safeInvoke<string>('capture_screenshot')

            // Upload and get back activity metadata
            const activity = await uploadScreenshot(base64);
            if (activity) {
                setScreenshots((prev) => [activity, ...prev])
            }
        } catch (e) {
            setError(String(e))
        }
    }, [isTauriReady])

    const startCapture = useCallback(async () => {
        try {
            setError(null)
            if (!isTauriReady) {
                const errorMsg = 'Screenshot capture is only available in Tauri desktop app'
                logger.warn(errorMsg)
                setError(errorMsg)
                return
            }

            logger.info(`Starting capture with interval: ${interval} minutes`)
            // Tauri converts camelCase to snake_case automatically, but we can be explicit
            const result = await safeInvoke('start_capture', { interval_minutes: interval })
            logger.info('Capture started successfully', result)
            setIsCapturing(true)
        } catch (e: any) {
            const errorMsg = e?.message || e?.toString() || 'Failed to start capture'
            logger.error('Failed to start capture', { error: e, message: errorMsg })
            setError(errorMsg)
            setIsCapturing(false)
        }
    }, [interval, isTauriReady])

    const stopCapture = useCallback(async () => {
        try {
            setError(null)
            if (!isTauriReady) {
                setIsCapturing(false)
                return
            }
            await safeInvoke('stop_capture')
            setIsCapturing(false)
        } catch (e) {
            setError(String(e))
        }
    }, [isTauriReady])

    // Fetch activities on mount
    useEffect(() => {
        fetchActivities()
    }, [fetchActivities])

    // Event Listener & Initial State Sync
    useEffect(() => {
        let unlisten: (() => void) | undefined

        const setupListener = async () => {
            if (!isTauriReady) {
                return
            }

            try {
                // Sync initial state
                try {
                    const running = await safeInvoke<boolean>('is_capturing')
                    setIsCapturing(running)
                } catch (e) {
                    logger.error("Failed to sync capture state", e)
                }

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
    }, [isTauriReady])

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
