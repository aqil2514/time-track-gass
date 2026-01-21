import React from 'react'
import { Card } from './Card'
import { Badge } from './Badge'
import { formatTimeRange } from '../lib/utils'
import type { Screenshot } from '../types'
import { Clock, Monitor } from 'lucide-react'

interface ActivityTimelineProps {
    screenshots: Screenshot[]
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ screenshots }) => {
    if (screenshots.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
                <Clock className="w-10 h-10 mb-2 opacity-20" />
                <p>No activity recorded today</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {screenshots.map((shot) => (
                <Card key={shot.id} className="group overflow-hidden border-border/50 bg-card/40 hover:bg-card/60 transition-colors">
                    <div className="flex items-start gap-4 p-4">
                        <div className="flex-shrink-0 mt-1">
                            <div className="p-2 rounded-full bg-primary/10 text-primary">
                                <Monitor className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium truncate text-foreground/90">
                                        {shot.app_name || 'Unknown App'}
                                    </h4>
                                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                                        {shot.window_title || 'No window title'}
                                    </p>
                                </div>
                                <span className="text-xs font-mono text-muted-foreground ml-2 whitespace-nowrap">
                                    {formatTimeRange(shot.captured_at)}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Badge variant={getCategoryVariant(shot.category)}>{shot.category || 'Uncategorized'}</Badge>
                                {shot.summary && (
                                    <span className="text-xs text-muted-foreground truncate ml-2">
                                        {shot.summary}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    )
}

function getCategoryVariant(category: string): 'productive' | 'distracting' | 'neutral' | 'other' {
    const c = category.toLowerCase()
    if (['work', 'coding', 'development', 'productivity', 'meeting'].some(x => c.includes(x))) return 'productive'
    if (['social', 'entertainment', 'game', 'youtube', 'video'].some(x => c.includes(x))) return 'distracting'
    if (['neutral', 'utility', 'system'].some(x => c.includes(x))) return 'neutral'
    return 'other'
}
