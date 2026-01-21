import React from 'react'
import { cn } from '../lib/utils'

interface StatusIndicatorProps {
    active: boolean
    className?: string
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ active, className }) => {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <span className="relative flex h-3 w-3">
                {active && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                )}
                <span className={cn(
                    "relative inline-flex rounded-full h-3 w-3 transition-colors duration-500",
                    active ? "bg-green-500" : "bg-zinc-600"
                )}></span>
            </span>
            <span className={cn(
                "text-sm font-medium transition-colors duration-300",
                active ? "text-green-500" : "text-zinc-500"
            )}>
                {active ? "Recording" : "Paused"}
            </span>
        </div>
    )
}
