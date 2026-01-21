import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'
import './lib/logger' // Initialize global error handlers

// #region agent log
const checkTauriAtBootstrap = () => {
    const windowExists = typeof window !== 'undefined'
    const hasTauri = windowExists && '__TAURI__' in window
    const tauriValue = windowExists ? (window as any).__TAURI__ : null
    fetch('http://127.0.0.1:7250/ingest/6a1f26f2-0da9-4b94-a40d-9d8ab5a20d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.tsx:11',message:'Bootstrap Tauri check',data:{windowExists,hasTauri,tauriType:typeof tauriValue,tauriKeys:tauriValue?Object.keys(tauriValue):null,userAgent:windowExists?navigator.userAgent:null,url:windowExists?window.location.href:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{})
}
checkTauriAtBootstrap()
// #endregion

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
