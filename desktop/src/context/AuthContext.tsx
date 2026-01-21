import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';

interface User {
    id: string;
    email: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                try {
                    // Verify token and get user info
                    const response = await api.get('/auth/me');
                    setUser(response.data.data);
                    setToken(storedToken);

                    // Sync token with Tauri backend
                    try {
                        const { invoke } = await import('@tauri-apps/api/core')
                        await invoke('set_auth_token', { token: storedToken })
                    } catch (e) {
                        console.error('Failed to sync auth token with Tauri:', e)
                    }
                } catch (error) {
                    console.error("Failed to restore session:", error);
                    logout();
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUser);
    };

    const logout = async () => {
        try {
            // Attempt to stop capture if running and clear auth token
            // Only if Tauri is available (using centralized detection)
            const { isTauriSync } = await import('../lib/tauri')
            if (isTauriSync()) {
                const { invoke } = await import('@tauri-apps/api/core');
                await invoke('stop_capture');
                await invoke('clear_auth_token');
            }
        } catch (e) {
            console.error("Failed to cleanup during logout:", e);
        }

        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isLoading,
            login,
            logout,
            isAuthenticated: !!token
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
