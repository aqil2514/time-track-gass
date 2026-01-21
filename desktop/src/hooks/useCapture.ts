import { useState, useEffect, useCallback } from 'react'
import type { Screenshot } from '../types'
import { logger } from '../lib/logger'
import { api } from '../lib/api'

// #region agent log
const checkTauriAtModuleLoad = () => {
    const windowExists = typeof window !== 'undefined'
    const hasTauri = windowExists && '__TAURI__' in window
    const tauriValue = windowExists ? (window as any).__TAURI__ : null
    fetch('http://127.0.0.1:7250/ingest/6a1f26f2-0da9-4b94-a40d-9d8ab5a20d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCapture.ts:6',message:'Module load Tauri check',data:{windowExists,hasTauri,tauriType:typeof tauriValue,tauriKeys:tauriValue?Object.keys(tauriValue):null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{})
    return hasTauri
}
const isTauriAvailable = checkTauriAtModuleLoad()
// #endregion

// Helper to check if running in Tauri and show warning if not
export function checkTauriEnvironment(): boolean {
    if (!isTauriAvailable) {
        console.error('⚠️ WARNING: Aplikasi sedang berjalan di browser, bukan di Tauri desktop app!')
        console.error('⚠️ Untuk menggunakan fitur screenshot capture, jalankan aplikasi dengan: pnpm tauri dev')
        console.error('⚠️ Jangan buka http://localhost:1420 di browser secara manual!')
    }
    return isTauriAvailable
}

async function safeInvoke<T>(command: string, args?: any): Promise<T> {
    if (!isTauriAvailable) {
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
            if (!isTauriAvailable) {
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
    }, [])

    const startCapture = useCallback(async () => {
        try {
            setError(null)
            if (!isTauriAvailable) {
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
    }, [interval])

    const stopCapture = useCallback(async () => {
        try {
            setError(null)
            if (!isTauriAvailable) {
                setIsCapturing(false)
                return
            }
            await safeInvoke('stop_capture')
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
            if (!isTauriAvailable) {
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
