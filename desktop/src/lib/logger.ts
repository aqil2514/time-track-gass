// [logger.ts] - Centralized logging utility for TimeTrack Desktop
// Logs errors and warnings to both console and localStorage for debugging

interface LogEntry {
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    data?: unknown;
}

const MAX_LOG_ENTRIES = 100;
const LOG_STORAGE_KEY = 'timetrack_logs';

class Logger {
    private logs: LogEntry[] = [];

    constructor() {
        this.loadFromStorage();
    }

    private loadFromStorage() {
        try {
            const stored = localStorage.getItem(LOG_STORAGE_KEY);
            if (stored) {
                this.logs = JSON.parse(stored);
            }
        } catch {
            this.logs = [];
        }
    }

    private saveToStorage() {
        try {
            // Keep only last MAX_LOG_ENTRIES
            if (this.logs.length > MAX_LOG_ENTRIES) {
                this.logs = this.logs.slice(-MAX_LOG_ENTRIES);
            }
            localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.logs));
        } catch (e) {
            console.error('Failed to save logs to storage', e);
        }
    }

    private formatEntry(entry: LogEntry): string {
        return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
    }

    private addEntry(level: LogEntry['level'], message: string, data?: unknown) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data,
        };

        this.logs.push(entry);
        this.saveToStorage();

        // Also log to console with appropriate method
        const formatted = this.formatEntry(entry);
        switch (level) {
            case 'error':
                console.error(formatted, data ?? '');
                break;
            case 'warn':
                console.warn(formatted, data ?? '');
                break;
            default:
                console.log(formatted, data ?? '');
        }
    }

    info(message: string, data?: unknown) {
        this.addEntry('info', message, data);
    }

    warn(message: string, data?: unknown) {
        this.addEntry('warn', message, data);
    }

    error(message: string, data?: unknown) {
        this.addEntry('error', message, data);
    }

    getLogs(): LogEntry[] {
        return [...this.logs];
    }

    getLogsAsText(): string {
        return this.logs
            .map((entry) => {
                let line = this.formatEntry(entry);
                if (entry.data) {
                    line += ` | Data: ${JSON.stringify(entry.data)}`;
                }
                return line;
            })
            .join('\n');
    }

    clearLogs() {
        this.logs = [];
        localStorage.removeItem(LOG_STORAGE_KEY);
    }

    downloadLogs() {
        const content = this.getLogsAsText();
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `timetrack-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

export const logger = new Logger();

// Global error handler
window.onerror = (message, source, lineno, colno, error) => {
    logger.error(`Uncaught error: ${message}`, { source, lineno, colno, error: error?.stack });
};

window.onunhandledrejection = (event) => {
    logger.error(`Unhandled promise rejection: ${event.reason}`, { reason: event.reason });
};
