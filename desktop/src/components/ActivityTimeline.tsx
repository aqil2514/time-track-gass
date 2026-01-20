import React from 'react'
import { Card } from './Card'
import { Badge } from './Badge'
import { formatTimeRange } from '../lib/utils'
import type { Screenshot } from '../types'
import { Clock, Image as ImageIcon } from 'lucide-react'

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
        <div className="space-y-4">
            {screenshots.map((shot) => (
                <Card key={shot.id} className="group overflow-hidden border-border/50 bg-card/40 hover:bg-card/60 transition-colors">
                    <div className="flex items-start gap-4 p-4">
                        <div className="flex-shrink-0 mt-1">
                            <div className="w-2 h-full absolute left-4 top-0 bottom-0 bg-border/50 -z-10 hidden" />
                            {/* Timeline line could be added here for visual flair */}
                            <div className="p-2 rounded-full bg-primary/10 text-primary">
                                <ImageIcon className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-medium truncate text-foreground/90">
                                    Screen Capture
                                </h4>
                                <span className="text-xs font-mono text-muted-foreground">
                                    {formatTimeRange(shot.timestamp)}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                                <Badge variant="other">Uncategorized</Badge>
                            </div>

                            <div className="relative rounded-md overflow-hidden border border-border/50 bg-black/20 aspect-video group-hover:border-primary/20 transition-colors">
                                <img
                                    src={`data:image/png;base64,${shot.data}`}
                                    alt="Screenshot"
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    )
}
