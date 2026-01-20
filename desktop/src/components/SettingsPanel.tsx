// [SettingsPanel.tsx] - Settings panel component with log viewer and download

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './Card'
import { Button } from './Button'
import { X, Download, Trash2, FileText } from 'lucide-react'
import { logger } from '../lib/logger'

interface SettingsPanelProps {
    isOpen: boolean
    onClose: () => void
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
    const [logPreview, setLogPreview] = useState<string>('')
    const [showLogs, setShowLogs] = useState(false)

    if (!isOpen) return null

    const handleViewLogs = () => {
        const logs = logger.getLogsAsText()
        setLogPreview(logs || 'No logs recorded yet.')
        setShowLogs(true)
    }

    const handleDownloadLogs = () => {
        logger.downloadLogs()
    }

    const handleClearLogs = () => {
        logger.clearLogs()
        setLogPreview('Logs cleared.')
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
            <Card className="w-full max-w-lg mx-4 bg-card border-border shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle className="text-lg">Settings</CardTitle>
                        <CardDescription>App configuration and diagnostics</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* DIAGNOSTICS SECTION */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-foreground/80">Diagnostics</h3>

                        <div className="flex flex-wrap gap-2">
                            <Button variant="secondary" size="sm" onClick={handleViewLogs} className="gap-2">
                                <FileText className="w-4 h-4" />
                                View Logs
                            </Button>
                            <Button variant="secondary" size="sm" onClick={handleDownloadLogs} className="gap-2">
                                <Download className="w-4 h-4" />
                                Download Logs
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleClearLogs} className="gap-2 text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                                Clear Logs
                            </Button>
                        </div>

                        {showLogs && (
                            <div className="mt-3">
                                <pre className="text-xs bg-black/30 p-3 rounded-md overflow-auto max-h-60 text-muted-foreground font-mono whitespace-pre-wrap break-all">
                                    {logPreview}
                                </pre>
                            </div>
                        )}
                    </div>

                    {/* INFO SECTION */}
                    <div className="space-y-2 pt-4 border-t border-border/50">
                        <h3 className="text-sm font-medium text-foreground/80">About</h3>
                        <div className="text-xs text-muted-foreground space-y-1">
                            <p><strong>Version:</strong> 0.1.0</p>
                            <p><strong>Log Storage:</strong> localStorage (browser)</p>
                            <p><strong>Max Logs:</strong> 100 entries</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
