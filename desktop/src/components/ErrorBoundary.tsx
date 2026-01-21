import { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from './Button'

interface Props {
    children?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
    errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
        this.setState({ errorInfo })
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
                    <div className="max-w-xl w-full bg-card border border-destructive/50 rounded-lg p-6 shadow-xl space-y-4">
                        <h2 className="text-xl font-bold text-destructive flex items-center gap-2">
                            Something went wrong
                        </h2>

                        <div className="bg-muted/50 p-4 rounded-md overflow-auto max-h-60 text-xs font-mono">
                            <p className="font-semibold text-destructive mb-2">
                                {this.state.error?.toString()}
                            </p>
                            <pre className="text-muted-foreground whitespace-pre-wrap">
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={() => window.location.reload()}>
                                Reload Application
                            </Button>
                            <Button variant="secondary" onClick={() => {
                                localStorage.clear();
                                window.location.reload();
                            }}>
                                Clear Storage & Reload
                            </Button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
