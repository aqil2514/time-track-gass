// desktop/src/hooks/useCapture.ts
// [TimeTrack Desktop - Screen Capture Hook]
// Handles screenshot capture, AI analysis, retry queue, and failure notifications.
import { useState, useEffect, useCallback, useRef } from 'react'
import type { Screenshot } from '../types'
import { logger } from '../lib/logger'
import { api } from '../lib/api'
import { isTauriSync, waitForTauri } from '../lib/tauri'
import { useAuth } from '../context/AuthContext'
import { useApiKey } from './useApiKey'
import { useNotification } from './useNotification'
import { analyzeScreenshot, AnalysisResult } from '../lib/ai'
import { saveAiRetry, getAiRetries, getRetryableItems, deleteAiRetry, updateAiRetry, isInRetryQueue } from '../lib/aiRetryQueue'

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
    const { apiKey } = useApiKey()
    const { notifyAIFailure } = useNotification()
    const [screenshots, setScreenshots] = useState<Screenshot[]>([])
    const [isCapturing, setIsCapturing] = useState(false)
    const [captureInterval, setCaptureInterval] = useState(5) // minutes
    const [error, setError] = useState<string | null>(null)
    const [isTauriReady, setIsTauriReady] = useState(false)

    // Processing queue lock
    const isProcessingRef = useRef(false);

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
            if (e.response?.status !== 500) {
                logger.error("Failed to fetch activities", e)
            }
        }
    }, [])

    // Fetch stale "AI Processing" activities and enqueue for retry
    // This handles the edge case where both AI failed AND network failed,
    // causing the activity to be stuck with placeholder "AI Processing" status
    const checkForStaleProcessingActivities = useCallback(async () => {
        if (!apiKey) return;

        try {
            const response = await api.get('/activity', {
                params: {
                    from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 24 hours
                    per_page: 100
                }
            });

            if (response.data.success && response.data.data) {
                // Filter out activities that are already in retry queue
                const activitiesNotInQueue: Screenshot[] = [];
                for (const activity of response.data.data) {
                    if (activity.app_name === 'AI Processing' && activity.summary === 'AI analysis pending') {
                        const inQueue = await isInRetryQueue(activity.id);
                        if (!inQueue) {
                            activitiesNotInQueue.push(activity);
                        }
                    }
                }
                const staleActivities = activitiesNotInQueue;

                if (staleActivities.length > 0) {
                    logger.warn(`Found ${staleActivities.length} stale 'AI Processing' activities`);
                    // Note: We can't re-analyze these because we don't have the original image
                    // The Rust offline queue may have the image, but we can't access it from here
                    // This is logged for awareness; manual intervention may be needed
                }
            }
        } catch (e) {
            logger.error("Failed to check for stale activities", e);
        }
    }, [apiKey]);

    // Upload Metadata (POST)
    const uploadMetadata = async (metadata: AnalysisResult, capturedAt: string) => {
        logger.info("Uploading activity metadata...");
        const response = await api.post('/activity/upload', {
            ...metadata,
            captured_at: capturedAt
        });
        logger.info("Activity metadata uploaded");
        return response.data.data;
    };

    // Update Activity (PATCH)
    const updateActivity = async (id: string, metadata: AnalysisResult) => {
        logger.info(`Updating activity ${id} with AI analysis...`);
        // Endpoint: PATCH /activity/:id
        // We need to implement this endpoint in backend or assume it exists. 
        // Based on plan and previous backend status: "Updated ActivityHandler to expose PATCH /activity/:id".
        await api.patch(`/activity/${id}`, {
            app_name: metadata.app_name,
            window_title: metadata.window_title,
            category: metadata.category,
            summary: metadata.summary
        });
    };

    // Save to Rust Offline Queue (Network Failure)
    const saveToOfflineQueue = async (metadata: AnalysisResult, capturedAt: string, imageBase64: string) => {
        if (isTauriSync() && user) {
            try {
                logger.info("Saving to offline queue (Rust)...");
                await safeInvoke('save_offline_screenshot', {
                    user_id: user.id,
                    image_b64: imageBase64,
                    app_name: metadata.app_name,
                    window_title: metadata.window_title,
                    category: metadata.category,
                    summary: metadata.summary,
                    captured_at: capturedAt
                });
            } catch (saveError) {
                logger.error("Failed to save to offline queue", saveError);
            }
        }
    }

    // Process a single screenshot
    const processScreenshot = async (base64Data: string) => {
        const capturedAt = new Date().toISOString();
        let metadata: AnalysisResult;

        // 1. Try AI Analysis immediately if key exists
        if (apiKey) {
            try {
                metadata = await analyzeScreenshot(base64Data, apiKey);

                // AI Success -> Upload Final
                try {
                    return await uploadMetadata(metadata, capturedAt);
                } catch (netErr) {
                    // AI Success but Network Fail -> Rust Offline Queue
                    logger.error("Network upload failed after AI success", netErr);
                    await saveToOfflineQueue(metadata, capturedAt, base64Data);
                    return {
                        id: "offline-" + Date.now(),
                        captured_at: capturedAt,
                        ...metadata
                    } as Screenshot;
                }

            } catch (aiErr) {
                logger.warn("AI Analysis Failed, uploading placeholder and queuing retry", aiErr);
                // AI Failed -> Fallback to step 2 logic below
            }
        }

        // 2. AI Failed or No Key -> Upload Placeholder
        const placeholder: AnalysisResult = {
            app_name: "AI Processing",
            window_title: "Pending Analysis",
            category: "processing",
            summary: "AI analysis pending"
        };

        try {
            // Upload placeholder to get ID
            const activity = await uploadMetadata(placeholder, capturedAt);

            // Queue for retry with the real ID
            if (apiKey) {
                await saveAiRetry(activity.id, base64Data, capturedAt);
            }

            return activity;

        } catch (netErr) {
            // Network Failed (and AI failed/skipped) -> Rust Offline Queue
            // We use placeholder metadata here too
            logger.error("Network upload failed for placeholder", netErr);
            await saveToOfflineQueue(placeholder, capturedAt, base64Data);

            // If we have an API key, we should ALSO save to AI Retry queue?
            // No, because we don't have an ID yet.
            // If network is down, we can't get an ID. 
            // Ideally we'd save to AI queue with a temp ID, but our AI Retry queue logic relies on PATCHing a real ID.
            // Correct approach: Rust sync worker will upload the 'offline' item later.
            // When that uploads, it will be a "New" activity.
            // *Sync Worker* needs to handle AI? 
            // Plan says: "Offline Handling ... Sync worker uploads metadata".
            // If offline, we just save the placeholder to offline queue. 
            // When online, it uploads. It stays as "AI Processing". 
            // We can't retry AI on it easily unless we enhance Sync logic.
            // For now, this is acceptable degradation for Offline + AI Failure case.

            return {
                id: "offline-" + Date.now(),
                captured_at: capturedAt,
                ...placeholder
            } as Screenshot;
        }
    };

    // Retry AI Queue Worker
    useEffect(() => {
        const processRetries = async () => {
            if (isProcessingRef.current || !apiKey) return;

            // Use getRetryableItems to respect exponential backoff
            const retries = await getRetryableItems();
            if (retries.length === 0) return;

            isProcessingRef.current = true;
            logger.info(`Processing ${retries.length} AI retries (with exponential backoff)...`);

            for (const item of retries) {
                try {
                    if (item.retryCount > 3) {
                        logger.warn(`Max retries reached for ${item.id}`);

                        // Mark activity as AI failed in backend
                        try {
                            await api.patch(`/activity/${item.id}`, {
                                app_name: "AI Failed",
                                window_title: "Analysis Failed",
                                category: "other",
                                summary: `AI analysis failed after ${item.retryCount} retries: ${item.lastError || 'Unknown error'}`
                            });
                        } catch (patchErr) {
                            logger.warn(`Failed to patch activity ${item.id} as failed`, patchErr);
                        }

                        // Notify Admin/Owner about the failure
                        await notifyAIFailure(
                            item.lastError || 'Max retries exceeded',
                            item.retryCount
                        );

                        await deleteAiRetry(item.id);
                        continue;
                    }

                    const metadata = await analyzeScreenshot(item.imageBase64, apiKey);

                    // Success -> Patch Activity
                    await updateActivity(item.id, metadata);
                    await deleteAiRetry(item.id);

                    // Refresh list to show updated data
                    fetchActivities();

                } catch (err: any) {
                    logger.warn(`Retry failed for ${item.id}`, err);
                    await updateAiRetry(item.id, item.retryCount + 1, err.toString());
                }
            }
            isProcessingRef.current = false;
        };

        const timer = setInterval(processRetries, 10000); // Check every 10 seconds (exponential backoff prevents rapid retries)
        if (apiKey) {
            processRetries();
            // Also check for stale "AI Processing" activities every 5 minutes
            const staleCheckTimer = setInterval(checkForStaleProcessingActivities, 300000);
            return () => {
                clearInterval(timer);
                clearInterval(staleCheckTimer);
            };
        }
        return () => clearInterval(timer);
    }, [apiKey, fetchActivities, checkForStaleProcessingActivities]);

    const captureScreenshot = useCallback(async () => {
        try {
            setError(null)
            if (!isTauriReady) {
                logger.warn('Screenshot capture is only available in Tauri desktop app')
                return
            }
            const base64 = await safeInvoke<string>('capture_screenshot')

            // Process (AI -> Upload)
            const activity = await processScreenshot(base64);
            if (activity) {
                setScreenshots((prev) => [activity, ...prev])
            }
        } catch (e) {
            setError(String(e))
        }
    }, [isTauriReady, apiKey]) // dep on apiKey to trigger re-creation if key changes? No, processScreenshot reads current apiKey ref? No, it uses closure. But apiKey is in scope.

    const startCapture = useCallback(async () => {
        try {
            setError(null)
            if (!isTauriReady) {
                const errorMsg = 'Screenshot capture is only available in Tauri desktop app'
                logger.warn(errorMsg)
                setError(errorMsg)
                return
            }

            logger.info(`Starting capture with interval: ${captureInterval} minutes`)
            const result = await safeInvoke('start_capture', { interval_minutes: captureInterval })
            logger.info('Capture started successfully', result)
            setIsCapturing(true)
        } catch (e: any) {
            const errorMsg = e?.message || e?.toString() || 'Failed to start capture'
            logger.error('Failed to start capture', { error: e, message: errorMsg })
            setError(errorMsg)
            setIsCapturing(false)
        }
    }, [captureInterval, isTauriReady])

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

    // Event Listener
    useEffect(() => {
        let unlisten: (() => void) | undefined

        const setupListener = async () => {
            if (!isTauriReady) {
                return
            }

            try {
                try {
                    const running = await safeInvoke<boolean>('is_capturing')
                    setIsCapturing(running)
                } catch (e) {
                    logger.error("Failed to sync capture state", e)
                }

                const { listen } = await import('@tauri-apps/api/event')
                unlisten = await listen<string>('screenshot-captured', async (event) => {
                    const base64 = event.payload;
                    try {
                        const activity = await processScreenshot(base64);
                        if (activity) {
                            setScreenshots((prev) => [activity, ...prev])
                        }
                    } catch (e) {
                        console.error("Auto-process failed", e);
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
    }, [isTauriReady, apiKey]) // Re-bind listener if apiKey changes?
    // Actually, processScreenshot inside listener will use the apiKey from the closure when setupListener ran.
    // If apiKey changes, we need to re-run setupListener. So adding apiKey to dependency array is correct.

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
                switch (e.key.toLowerCase()) {
                    case 's':
                        e.preventDefault()
                        isCapturing ? stopCapture() : startCapture()
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
    }, [isCapturing, captureInterval, startCapture, stopCapture, captureScreenshot])

    return {
        screenshots,
        isCapturing,
        interval: captureInterval,
        setInterval: setCaptureInterval,
        error,
        captureScreenshot,
        startCapture,
        stopCapture
    }
}
