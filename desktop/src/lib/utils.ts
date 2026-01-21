import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
        return `${hours}h ${mins}m`
    }
    return `${mins}m`
}

export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatTimeRange(time: Date | string): string {
    const d = typeof time === 'string' ? new Date(time) : time
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}
