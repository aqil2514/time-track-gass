/**
 * [tauri.ts]
 * Centralized Tauri environment detection for Tauri v2
 * 
 * In Tauri v2, the global `__TAURI__` object is NOT automatically exposed.
 * Instead, we check for `__TAURI_INTERNALS__` which is always available in Tauri context.
 */

let cachedResult: boolean | null = null

/**
 * Check if running in Tauri environment (Tauri v2 compatible)
 * 
 * Detection methods:
 * 1. Check for __TAURI_INTERNALS__ (Tauri v2 internal object)
 * 2. Check for __TAURI__ (legacy, may not be available)
 * 3. Check navigator.userAgent for "Tauri"
 */
export function isTauriSync(): boolean {
    if (typeof window === 'undefined') return false

    // Tauri v2: Check for internal object
    if ('__TAURI_INTERNALS__' in window) return true

    // Tauri v1 fallback: Check for __TAURI__
    if ('__TAURI__' in window) return true

    // Additional check: User agent (Tauri adds this)
    if (typeof navigator !== 'undefined' && navigator.userAgent.includes('Tauri')) return true

    return false
}

/**
 * Async check with retry - use during app initialization
 * Waits for Tauri to be fully initialized
 */
export async function waitForTauri(timeout = 3000): Promise<boolean> {
    // Return cached result if already determined
    if (cachedResult !== null) {
        return cachedResult
    }

    // If already available, return immediately
    if (isTauriSync()) {
        cachedResult = true
        return true
    }

    // Wait and retry - Tauri might inject later
    const start = Date.now()
    while (Date.now() - start < timeout) {
        if (isTauriSync()) {
            cachedResult = true
            return true
        }
        await new Promise(resolve => setTimeout(resolve, 50))
    }

    // Final check: try to invoke a Tauri command
    // This is the most reliable way to detect Tauri v2
    try {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('is_capturing') // Use any available command
        cachedResult = true
        return true
    } catch (e) {
        // Not in Tauri or command failed
        cachedResult = false
        return false
    }
}

/**
 * Reset cache - useful for testing
 */
export function resetTauriCache(): void {
    cachedResult = null
}
