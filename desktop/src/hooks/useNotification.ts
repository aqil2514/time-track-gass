// desktop/src/hooks/useNotification.ts
// [TimeTrack Desktop - Notification Hook]
// Sends notifications to backend (e.g., AI failure notifications for Admin/Owner visibility)

import { api } from '../lib/api';
import { logger } from '../lib/logger';
import { useAuth } from '../context/AuthContext';

export interface NotificationPayload {
    type: 'ai_failure' | 'sync_error' | 'system';
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
}

/**
 * Hook for sending notifications to the backend.
 * Used by desktop app to notify Admin/Owner of issues like AI failures.
 */
export function useNotification() {
    const { user, isAuthenticated } = useAuth();

    /**
     * Send a notification to the backend.
     * Silently fails if user is not authenticated or request fails.
     */
    const sendNotification = async (payload: NotificationPayload): Promise<boolean> => {
        if (!isAuthenticated || !user) {
            logger.warn('Cannot send notification: user not authenticated');
            return false;
        }

        try {
            await api.post('/org/notifications', {
                type: payload.type,
                title: payload.title,
                message: payload.message,
                metadata: payload.metadata,
            });
            logger.info('Notification sent to backend', { type: payload.type });
            return true;
        } catch (error: unknown) {
            // Don't fail loudly - notifications are best-effort
            logger.warn('Failed to send notification to backend', error);
            return false;
        }
    };

    /**
     * Convenience method for sending AI failure notifications.
     * Includes user context automatically.
     */
    const notifyAIFailure = async (error: string, retryCount: number): Promise<boolean> => {
        return sendNotification({
            type: 'ai_failure',
            title: `AI Analysis Failed for ${user?.name || user?.email || 'Member'}`,
            message: `Screenshot analysis failed after ${retryCount} retries. Error: ${error}`,
            metadata: {
                member_id: user?.id,
                member_name: user?.name || user?.email,
                error: error,
                retry_count: retryCount,
                timestamp: new Date().toISOString(),
            },
        });
    };

    /**
     * Convenience method for sending sync error notifications.
     */
    const notifySyncError = async (error: string): Promise<boolean> => {
        return sendNotification({
            type: 'sync_error',
            title: `Sync Error for ${user?.name || user?.email || 'Member'}`,
            message: `Failed to sync offline data. Error: ${error}`,
            metadata: {
                member_id: user?.id,
                member_name: user?.name || user?.email,
                error: error,
                timestamp: new Date().toISOString(),
            },
        });
    };

    return {
        sendNotification,
        notifyAIFailure,
        notifySyncError,
    };
}
