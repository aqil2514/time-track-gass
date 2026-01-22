// desktop/src/hooks/useApiKey.ts
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { logger } from '../lib/logger';

export function useApiKey() {
    const { isAuthenticated } = useAuth();
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            setApiKey(null);
            return;
        }

        const fetchKey = async () => {
            setIsLoading(true);
            try {
                // Try to get from localStorage first (encrypted or just raw for now, plan says cache in memory/secure storage)
                // For simplicity and "memory" caching, we rely on React state, but if we reload app we lose it.
                // We fetch from backend every app load.
                const response = await api.get('/org/api-key');
                if (response.data.success && response.data.data.api_key) {
                    setApiKey(response.data.data.api_key);
                }
            } catch (e: any) {
                // 404 means not configured, which is fine
                if (e.response?.status !== 404) {
                    logger.error("Failed to fetch API key", e);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchKey();
    }, [isAuthenticated]);

    return { apiKey, isLoading };
}
