import { useState, useEffect } from 'react'
import { useCapture } from '../hooks/useCapture'
import { useAuth } from '../context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card'
import { Button } from '../components/Button'
import { StatusIndicator } from '../components/StatusIndicator'
import { ActivityTimeline } from '../components/ActivityTimeline'
import { SettingsPanel } from '../components/SettingsPanel'
import { Settings, Play, Pause, Camera, Clock, Activity, LogOut } from 'lucide-react'
import { formatTime } from '../lib/utils'

export function Dashboard() {
    const {
        screenshots,
        isCapturing,
        interval,
        setInterval,
        error,
        captureScreenshot,
        startCapture,
        stopCapture
    } = useCapture()

    const { user, logout } = useAuth()
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    // Dashboard summary stats
    const todayStats = {
        totalTime: 0, // minutes
        productivity: 0, // percentage (placeholder for future implementation)
        activityCount: screenshots.length
    }

    // Calculate time based on screenshots count * interval
    if (screenshots.length > 0) {
        todayStats.totalTime = screenshots.length * interval
        // productivity remains 0 until backend analysis is implemented
    }

    // Cleanup capture on unmount/logout
    useEffect(() => {
        return () => {
            // When dashboard unmounts (e.g. logout), ensure capture stops
            // We use a fire-and-forget approach here since we can't await in cleanup
            stopCapture().catch(e => console.error("Failed to stop capture on unmount:", e));
        };
    }, [stopCapture]);

    return (
        <div className="min-h-screen p-6 md:p-8 animate-in fade-in duration-500">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* HEADER */}
                <header className="flex justify-between items-center bg-card/40 backdrop-blur-md p-4 rounded-xl border border-border/50 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Activity className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">TimeTrack</h1>
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-muted-foreground">Personal Dashboard</p>
                                {user && <span className="text-xs font-medium text-primary"> • {user.email}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <StatusIndicator active={isCapturing} />
                        <div className="h-6 w-px bg-border/50" />

                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setIsSettingsOpen(true)}>
                                <Settings className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={logout}>
                                <LogOut className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </header>

                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive-foreground px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                        <span className="font-bold">Error:</span> {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* LEFT COLUMN - STATS & CONTROLS */}
                    <div className="space-y-6">

                        {/* TODAY STATS */}
                        <Card className="bg-gradient-to-br from-card/80 to-card/40">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center text-lg">
                                    Today
                                    <span className="text-xs font-normal text-muted-foreground font-mono">
                                        {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Total Time</p>
                                        <p className="text-3xl font-bold tracking-tight">{formatTime(todayStats.totalTime)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Productive</p>
                                        <p className="text-3xl font-bold tracking-tight text-green-500">{todayStats.productivity}%</p>
                                    </div>
                                </div>

                                <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-1000 ease-out"
                                        style={{ width: `${Math.min(todayStats.productivity, 100)}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* CONTROLS */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Tracking Controls</CardTitle>
                                <CardDescription>Manage screenshot capture</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">

                                <div className="space-y-3">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Capture Interval
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            max="60"
                                            value={interval}
                                            onChange={(e) => setInterval(Number(e.target.value))}
                                            disabled={isCapturing}
                                            className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                        <span className="text-sm text-muted-foreground">min</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {!isCapturing ? (
                                        <Button onClick={startCapture} className="w-full gap-2">
                                            <Play className="w-4 h-4" /> Start Tracking
                                        </Button>
                                    ) : (
                                        <Button onClick={stopCapture} variant="destructive" className="w-full gap-2">
                                            <Pause className="w-4 h-4" /> Pause Tracking
                                        </Button>
                                    )}

                                    <Button onClick={captureScreenshot} variant="secondary" className="w-full gap-2">
                                        <Camera className="w-4 h-4" /> Capture Now
                                    </Button>

                                    <div className="flex justify-between px-1">
                                        <span className="text-[10px] text-muted-foreground/70 font-mono">Ctrl+Shift+S</span>
                                        <span className="text-[10px] text-muted-foreground/70 font-mono">Ctrl+Shift+C</span>
                                    </div>
                                </div>

                                {isCapturing && (
                                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground animate-pulse-soft">
                                        <Clock className="w-3 h-3" />
                                        Next capture in {interval} minutes
                                    </div>
                                )}

                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN - TIMELINE */}
                    <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold tracking-tight">Activity Timeline</h2>
                            <span className="text-sm text-muted-foreground">{screenshots.length} captures</span>
                        </div>

                        <ActivityTimeline screenshots={screenshots} />
                    </div>

                </div>
            </div>

            <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    )
}
