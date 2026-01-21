import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'
import { useState, useEffect } from 'react'
import { waitForTauri } from '../lib/tauri'

export function BrowserWarning() {
    const [isTauri, setIsTauri] = useState<boolean | null>(null) // null = loading

    useEffect(() => {
        waitForTauri(5000).then(setIsTauri)
    }, [])

    // Still loading
    if (isTauri === null) {
        return null
    }

    // Running in Tauri - no warning needed
    if (isTauri) {
        return null
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
            <div className="max-w-2xl mx-4 p-8 bg-destructive/10 border-2 border-destructive rounded-xl shadow-2xl">
                <div className="flex items-start gap-4">
                    <AlertTriangle className="w-12 h-12 text-destructive flex-shrink-0 mt-1" />
                    <div className="flex-1 space-y-4">
                        <div>
                            <h2 className="text-2xl font-bold text-destructive mb-2">
                                ⚠️ Aplikasi Dibuka di Browser!
                            </h2>
                            <p className="text-lg text-foreground mb-4">
                                Fitur screenshot capture hanya tersedia di Tauri Desktop App, bukan di browser.
                            </p>
                        </div>

                        <div className="bg-background/50 p-4 rounded-lg space-y-3">
                            <div className="font-semibold text-foreground">Cara menjalankan aplikasi dengan benar:</div>
                            <ol className="list-decimal list-inside space-y-2 text-foreground/90">
                                <li>Tutup browser ini</li>
                                <li>Buka PowerShell/Terminal</li>
                                <li>Jalankan perintah berikut:</li>
                            </ol>
                            <div className="bg-black/20 p-3 rounded font-mono text-sm text-green-400">
                                pnpm dev:desktop
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Tauri window akan terbuka otomatis. Gunakan aplikasi di window tersebut, bukan di browser!
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                onClick={() => window.close()}
                                variant="destructive"
                                className="flex-1"
                            >
                                Tutup Browser
                            </Button>
                            <Button
                                onClick={() => {
                                    const text = 'pnpm dev:desktop'
                                    navigator.clipboard.writeText(text).then(() => {
                                        alert('Perintah sudah di-copy ke clipboard!')
                                    })
                                }}
                                variant="secondary"
                            >
                                Copy Command
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
