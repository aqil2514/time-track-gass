# Plan: Cross-Platform Screenshot & Tauri Detection Fix

**Created:** 2026-01-21
**Status:** Implemented ✅
**Priority:** High

---

## Problem Summary

### Issue 1: Tauri Detection Race Condition
Desktop app mendeteksi environment sebagai "browser" padahal running di Tauri, sehingga:
- Warning "Aplikasi Dibuka di Browser" muncul
- Screenshot capture tidak berfungsi

**Root Cause:**
```
Timeline:
1. Browser/Tauri load HTML
2. Vite load main.tsx (module)
3. main.tsx import useCapture.ts
4. useCapture.ts line 14: const isTauriAvailable = checkTauriAtModuleLoad()
   → __TAURI__ belum ada di window → return FALSE (cached forever)
5. Tauri inject __TAURI__ ke window (terlambat)
6. App render, useCapture sudah "locked" di false
7. BrowserWarning polling tiap 500ms → eventually detect true
8. Tapi useCapture tetap false → screenshot gagal
```

### Issue 2: Windows-Only Screenshot
Screenshot functionality hanya support Windows. macOS dan Linux return error.

**Current Code (screenshots.rs:193-196):**
```rust
#[cfg(not(target_os = "windows"))]
{
    Err("Screenshot capture only supported on Windows for now".to_string())
}
```

---

### Issue 3: Large Screenshot File Size
Screenshot PNG 2-5 MB terlalu besar untuk upload dan AI processing.

**Impact:**
- Slow upload (2-4 seconds per screenshot on 10 Mbps)
- High bandwidth usage
- Large base64 strings in API calls
- Unnecessary detail untuk AI vision analysis

---

## Solution Overview

| Issue | Solution | Complexity |
|-------|----------|------------|
| Tauri detection race | Lazy/async detection utility | Low |
| Windows-only screenshot | Migrate ke `xcap` crate | Medium |
| Large file size | Resize + WebP compression | Medium |

---

## Part 1: Frontend - Fix Tauri Detection

### 1.1 Create Centralized Tauri Detection Utility

**New File:** `desktop/src/lib/tauri.ts`

```typescript
/**
 * Centralized Tauri environment detection
 * Handles race condition where __TAURI__ may not be available immediately
 */

let cachedResult: boolean | null = null

/**
 * Synchronous check - use only after app is fully loaded
 */
export function isTauriSync(): boolean {
    return typeof window !== 'undefined' && '__TAURI__' in window
}

/**
 * Async check with retry - use during app initialization
 * Waits for Tauri to inject __TAURI__ into window
 */
export async function waitForTauri(timeout = 3000): Promise<boolean> {
    // Return cached result if already determined
    if (cachedResult !== null) {
        return cachedResult
    }

    const start = Date.now()
    while (Date.now() - start < timeout) {
        if (isTauriSync()) {
            cachedResult = true
            return true
        }
        await new Promise(resolve => setTimeout(resolve, 50))
    }

    cachedResult = false
    return false
}

/**
 * Reset cache - useful for testing
 */
export function resetTauriCache(): void {
    cachedResult = null
}
```

### 1.2 Update useCapture.ts

**File:** `desktop/src/hooks/useCapture.ts`

Changes:
1. Remove module-level `isTauriAvailable` constant
2. Remove debug logging (fetch to 127.0.0.1:7250)
3. Use lazy detection per-function call
4. Add initialization state

```typescript
import { useState, useEffect, useCallback } from 'react'
import { isTauriSync, waitForTauri } from '../lib/tauri'
// ... rest of imports

export function useCapture() {
    const [screenshots, setScreenshots] = useState<Screenshot[]>([])
    const [isCapturing, setIsCapturing] = useState(false)
    const [interval, setInterval] = useState(5)
    const [error, setError] = useState<string | null>(null)
    const [isTauriReady, setIsTauriReady] = useState(false)

    // Initialize Tauri detection
    useEffect(() => {
        waitForTauri().then(setIsTauriReady)
    }, [])

    // Use isTauriReady instead of module-level constant
    const captureScreenshot = useCallback(async () => {
        if (!isTauriReady) {
            setError('Tauri not available')
            return
        }
        // ... existing capture logic
    }, [isTauriReady])

    // ... rest of hooks updated similarly
}
```

### 1.3 Update BrowserWarning.tsx

**File:** `desktop/src/components/BrowserWarning.tsx`

Changes:
1. Remove debug logging
2. Use shared `waitForTauri` utility
3. Simplify polling logic

```typescript
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

    // Running in browser - show warning
    return (
        // ... existing JSX
    )
}
```

### 1.4 Cleanup main.tsx

**File:** `desktop/src/main.tsx`

Remove debug logging code (lines 8-16).

---

## Part 2: Backend - Cross-Platform Screenshot

### 2.1 Update Cargo.toml

**File:** `desktop/src-tauri/Cargo.toml`

Before:
```toml
[target.'cfg(windows)'.dependencies]
screenshots = "0.7"
image = "0.24"
```

After:
```toml
[dependencies]
# ... existing deps
xcap = "0.0.14"
image = "0.25"
```

### 2.2 Rewrite screenshots.rs

**File:** `desktop/src-tauri/src/screenshots.rs`

```rust
use base64::Engine;
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::thread;
use std::time::Duration;
use xcap::Monitor;
use image::ImageEncoder;

// ... CaptureState unchanged ...

/// Capture a screenshot - cross-platform (Windows, macOS, Linux)
fn capture_screen_blocking() -> Result<String, String> {
    let monitors = Monitor::all().map_err(|e| format!("Failed to get monitors: {}", e))?;

    if monitors.is_empty() {
        return Err("No monitors found".to_string());
    }

    // Find primary monitor, fallback to first
    let monitor = monitors
        .into_iter()
        .find(|m| m.is_primary().unwrap_or(false))
        .or_else(|| Monitor::all().ok()?.into_iter().next())
        .ok_or("No monitor available")?;

    // Capture the screen
    let image = monitor
        .capture_image()
        .map_err(|e| format!("Failed to capture screen: {}", e))?;

    // Encode to PNG
    let mut png_buffer: Vec<u8> = Vec::new();
    {
        let encoder = image::codecs::png::PngEncoder::new(&mut png_buffer);
        encoder
            .write_image(
                image.as_raw(),
                image.width(),
                image.height(),
                image::ExtendedColorType::Rgba8,
            )
            .map_err(|e| format!("Failed to encode PNG: {}", e))?;
    }

    Ok(base64::engine::general_purpose::STANDARD.encode(&png_buffer))
}

// ... rest of functions unchanged ...
```

### 2.3 Multi-Monitor Support (Optional Enhancement)

If needed, can capture all monitors into single image:

```rust
fn capture_all_monitors() -> Result<String, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;

    // Calculate bounding box
    let mut min_x = i32::MAX;
    let mut min_y = i32::MAX;
    let mut max_x = i32::MIN;
    let mut max_y = i32::MIN;

    for monitor in &monitors {
        let x = monitor.x().unwrap_or(0);
        let y = monitor.y().unwrap_or(0);
        let w = monitor.width().unwrap_or(0) as i32;
        let h = monitor.height().unwrap_or(0) as i32;

        min_x = min_x.min(x);
        min_y = min_y.min(y);
        max_x = max_x.max(x + w);
        max_y = max_y.max(y + h);
    }

    // Create canvas and composite monitors
    // ... similar to current Windows implementation
}
```

---

## Part 3: Image Compression & Optimization

### 3.1 Compression Strategy

**Decision:**
- Compress di Desktop (Rust) sebelum upload
- Target resolusi: **1440x900**
- Format: **WebP**
- Quality: **80%**

**Expected Results:**

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| File size | 2-5 MB PNG | 50-120 KB WebP | **95-97%** smaller |
| Upload time (10 Mbps) | 2-4 seconds | 50-100 ms | **20-40x** faster |
| Base64 string length | 3-7 MB | 70-160 KB | **95%** shorter |

### 3.2 Update Cargo.toml

**File:** `desktop/src-tauri/Cargo.toml`

```toml
[dependencies]
# ... existing deps
xcap = "0.0.14"
image = "0.25"       # Upgrade for resize support
webp = "0.3"         # WebP encoding
```

### 3.3 Implement Compression in screenshots.rs

**File:** `desktop/src-tauri/src/screenshots.rs`

Add compression function:

```rust
use image::{DynamicImage, imageops::FilterType};
use webp::Encoder;

const TARGET_WIDTH: u32 = 1440;
const TARGET_HEIGHT: u32 = 900;
const WEBP_QUALITY: f32 = 80.0;

/// Resize image maintaining aspect ratio
fn resize_image(img: DynamicImage) -> DynamicImage {
    let (width, height) = (img.width(), img.height());

    // Calculate scale factor to fit within target dimensions
    let scale = f32::min(
        TARGET_WIDTH as f32 / width as f32,
        TARGET_HEIGHT as f32 / height as f32,
    );

    // Only downscale, never upscale
    if scale >= 1.0 {
        return img;
    }

    let new_width = (width as f32 * scale) as u32;
    let new_height = (height as f32 * scale) as u32;

    img.resize(new_width, new_height, FilterType::Lanczos3)
}

/// Encode image to WebP format
fn encode_webp(img: &DynamicImage) -> Result<Vec<u8>, String> {
    let encoder = Encoder::from_image(img)
        .map_err(|e| format!("Failed to create WebP encoder: {}", e))?;

    let webp_data = encoder.encode(WEBP_QUALITY);
    Ok(webp_data.to_vec())
}

/// Capture, resize, and compress screenshot
fn capture_screen_blocking() -> Result<String, String> {
    let monitors = Monitor::all().map_err(|e| format!("Failed to get monitors: {}", e))?;

    if monitors.is_empty() {
        return Err("No monitors found".to_string());
    }

    // Find primary monitor
    let monitor = monitors
        .into_iter()
        .find(|m| m.is_primary().unwrap_or(false))
        .or_else(|| Monitor::all().ok()?.into_iter().next())
        .ok_or("No monitor available")?;

    // Capture the screen
    let image = monitor
        .capture_image()
        .map_err(|e| format!("Failed to capture screen: {}", e))?;

    // Convert to DynamicImage for processing
    let dynamic_img = DynamicImage::ImageRgba8(image);

    // Resize to target dimensions
    let resized = resize_image(dynamic_img);

    // Encode to WebP
    let webp_data = encode_webp(&resized)?;

    // Return as base64
    Ok(base64::engine::general_purpose::STANDARD.encode(&webp_data))
}
```

### 3.4 Backend Compatibility

Backend perlu handle WebP format. Update `activity_handler.go` jika diperlukan:

```go
// Detect image format from base64 data
func detectImageFormat(base64Data string) string {
    // WebP magic bytes: "RIFF....WEBP"
    if strings.HasPrefix(base64Data, "UklGR") {
        return "webp"
    }
    // PNG magic bytes
    if strings.HasPrefix(base64Data, "iVBOR") {
        return "png"
    }
    // JPEG magic bytes
    if strings.HasPrefix(base64Data, "/9j/") {
        return "jpeg"
    }
    return "unknown"
}
```

### 3.5 AI Service Compatibility

Most AI vision APIs support WebP:
- ✅ OpenAI GPT-4V: Supports WebP
- ✅ Claude Vision: Supports WebP
- ✅ Google Gemini: Supports WebP

No changes needed to AI service code.

---

## Part 4: Platform-Specific Considerations

### Windows 10 & 11
- ✅ **Fully supported**
- Uses Windows Graphics Capture API (available since Windows 10 1903+)
- No special permissions needed
- Multi-monitor support built-in
- HDR display support

**Alternative (Windows-only, higher performance):**
```toml
# If Windows-only is acceptable, can use dedicated crate:
windows-capture = "1.5.0"
```
But xcap is recommended for cross-platform consistency.

### macOS
- Requires **Screen Recording Permission**
- First run: System will prompt user automatically
- User must grant in: System Preferences > Security & Privacy > Screen Recording
- xcap handles permission request automatically

### Linux
- X11: Works out of the box
- Wayland: Requires pipewire
- Dependencies:
  ```bash
  # Arch
  pacman -S base-devel clang libxcb libxrandr dbus libpipewire

  # Ubuntu/Debian
  apt install libxcb1-dev libxrandr-dev libdbus-1-dev libpipewire-0.3-dev clang
  ```

---

## Part 5: Offline Queue System

### 5.1 Design Decisions

| Aspek | Keputusan | Rationale |
|-------|-----------|-----------|
| Storage location | Rust file system | Persist even after app restart/crash |
| Storage path | `%APPDATA%/timetrack/pending/` (Windows) | Standard app data location |
| Sync strategy | Auto-sync saat online | User-friendly, no manual action needed |
| Check interval | 5 menit | Hemat resource, reasonable delay |
| Failure handling | Langsung queue, background retry | Non-blocking, screenshot immediately safe |
| Retention policy | Storage-based, max 500 MB | Adaptive, delete oldest when exceeded |
| Metadata format | Sidecar JSON per screenshot | Robust - one corrupt file doesn't affect others |
| UI indicator | None (silent background) | Keep UI simple, fully automatic |

### 5.2 File Structure

```
# Windows
%APPDATA%/timetrack/pending/

# macOS
~/Library/Application Support/timetrack/pending/

# Linux
~/.local/share/timetrack/pending/
```

**Directory contents:**
```
pending/
├── 2026-01-21_143052_abc123.webp      # Screenshot image
├── 2026-01-21_143052_abc123.json      # Metadata sidecar
├── 2026-01-21_143552_def456.webp
├── 2026-01-21_143552_def456.json
└── ...
```

### 5.3 Metadata Schema

**File:** `{timestamp}_{random_id}.json`

```json
{
  "id": "abc123",
  "user_id": 1,
  "captured_at": "2026-01-21T14:30:52+07:00",
  "retry_count": 0,
  "last_attempt": null,
  "last_error": null,
  "file_size_bytes": 85432
}
```

### 5.4 Implementation in Rust

**New File:** `desktop/src-tauri/src/offline_queue.rs`

```rust
// [offline_queue.rs] - Handles offline screenshot storage and sync

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::time::{Duration, SystemTime};
use tauri::api::path::app_data_dir;

const MAX_QUEUE_SIZE_BYTES: u64 = 500 * 1024 * 1024; // 500 MB
const SYNC_INTERVAL_SECS: u64 = 300; // 5 minutes

#[derive(Serialize, Deserialize, Clone)]
pub struct PendingScreenshot {
    pub id: String,
    pub user_id: i64,
    pub captured_at: String,
    pub retry_count: u32,
    pub last_attempt: Option<String>,
    pub last_error: Option<String>,
    pub file_size_bytes: u64,
}

/// Get the pending queue directory path
pub fn get_pending_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data = app_data_dir(&app_handle.config())
        .ok_or("Failed to get app data dir")?;
    let pending_dir = app_data.join("pending");
    
    // Create directory if not exists
    fs::create_dir_all(&pending_dir)
        .map_err(|e| format!("Failed to create pending dir: {}", e))?;
    
    Ok(pending_dir)
}

/// Save a screenshot to the pending queue
pub fn save_to_queue(
    app_handle: &tauri::AppHandle,
    user_id: i64,
    image_data: &[u8],
) -> Result<String, String> {
    let pending_dir = get_pending_dir(app_handle)?;
    
    // Generate unique ID
    let id = generate_id();
    let timestamp = chrono::Local::now().format("%Y-%m-%d_%H%M%S").to_string();
    let base_name = format!("{}_{}", timestamp, id);
    
    // Save image file
    let image_path = pending_dir.join(format!("{}.webp", base_name));
    fs::write(&image_path, image_data)
        .map_err(|e| format!("Failed to save image: {}", e))?;
    
    // Save metadata file
    let metadata = PendingScreenshot {
        id: id.clone(),
        user_id,
        captured_at: chrono::Local::now().to_rfc3339(),
        retry_count: 0,
        last_attempt: None,
        last_error: None,
        file_size_bytes: image_data.len() as u64,
    };
    
    let meta_path = pending_dir.join(format!("{}.json", base_name));
    let meta_json = serde_json::to_string_pretty(&metadata)
        .map_err(|e| format!("Failed to serialize metadata: {}", e))?;
    fs::write(&meta_path, meta_json)
        .map_err(|e| format!("Failed to save metadata: {}", e))?;
    
    // Enforce storage limit
    enforce_storage_limit(app_handle)?;
    
    Ok(id)
}

/// Get all pending screenshots
pub fn get_pending_items(app_handle: &tauri::AppHandle) -> Result<Vec<PendingScreenshot>, String> {
    let pending_dir = get_pending_dir(app_handle)?;
    let mut items = Vec::new();
    
    for entry in fs::read_dir(&pending_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        
        if path.extension().map_or(false, |ext| ext == "json") {
            let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
            if let Ok(meta) = serde_json::from_str::<PendingScreenshot>(&content) {
                items.push(meta);
            }
        }
    }
    
    // Sort by captured_at (oldest first)
    items.sort_by(|a, b| a.captured_at.cmp(&b.captured_at));
    
    Ok(items)
}

/// Remove a screenshot from the queue (after successful upload)
pub fn remove_from_queue(app_handle: &tauri::AppHandle, id: &str) -> Result<(), String> {
    let pending_dir = get_pending_dir(app_handle)?;
    
    // Find and delete both files
    for entry in fs::read_dir(&pending_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let file_name = path.file_stem().and_then(|s| s.to_str()).unwrap_or("");
        
        if file_name.ends_with(id) {
            fs::remove_file(&path).ok(); // Ignore errors
        }
    }
    
    Ok(())
}

/// Enforce storage limit by deleting oldest files
fn enforce_storage_limit(app_handle: &tauri::AppHandle) -> Result<(), String> {
    let pending_dir = get_pending_dir(app_handle)?;
    
    loop {
        let total_size = calculate_dir_size(&pending_dir)?;
        
        if total_size <= MAX_QUEUE_SIZE_BYTES {
            break;
        }
        
        // Find and delete oldest screenshot
        let items = get_pending_items(app_handle)?;
        if let Some(oldest) = items.first() {
            remove_from_queue(app_handle, &oldest.id)?;
            log::info!("Deleted oldest pending screenshot {} to enforce storage limit", oldest.id);
        } else {
            break;
        }
    }
    
    Ok(())
}

/// Calculate total directory size in bytes
fn calculate_dir_size(dir: &PathBuf) -> Result<u64, String> {
    let mut total = 0u64;
    
    for entry in fs::read_dir(dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        total += metadata.len();
    }
    
    Ok(total)
}

/// Generate a short random ID
fn generate_id() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    (0..6)
        .map(|_| {
            let idx = rng.gen_range(0..36);
            if idx < 10 {
                (b'0' + idx) as char
            } else {
                (b'a' + idx - 10) as char
            }
        })
        .collect()
}
```

### 5.5 Background Sync Worker

**In:** `desktop/src-tauri/src/main.rs`

```rust
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;
use tokio::time::interval;

static SYNC_RUNNING: AtomicBool = AtomicBool::new(false);

/// Start the background sync worker
pub fn start_sync_worker(app_handle: tauri::AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut interval = interval(Duration::from_secs(300)); // 5 minutes
        
        loop {
            interval.tick().await;
            
            // Skip if already syncing
            if SYNC_RUNNING.swap(true, Ordering::SeqCst) {
                continue;
            }
            
            // Check if online
            if !is_online().await {
                SYNC_RUNNING.store(false, Ordering::SeqCst);
                continue;
            }
            
            // Process pending queue
            if let Err(e) = process_pending_queue(&app_handle).await {
                log::error!("Sync error: {}", e);
            }
            
            SYNC_RUNNING.store(false, Ordering::SeqCst);
        }
    });
}

/// Check internet connectivity
async fn is_online() -> bool {
    // Simple check - try to reach the backend
    match reqwest::Client::new()
        .get("http://localhost:8080/api/health")
        .timeout(Duration::from_secs(5))
        .send()
        .await
    {
        Ok(resp) => resp.status().is_success(),
        Err(_) => false,
    }
}

/// Process all pending screenshots
async fn process_pending_queue(app_handle: &tauri::AppHandle) -> Result<(), String> {
    let items = offline_queue::get_pending_items(app_handle)?;
    
    for item in items {
        match upload_screenshot(app_handle, &item).await {
            Ok(_) => {
                offline_queue::remove_from_queue(app_handle, &item.id)?;
                log::info!("Synced pending screenshot: {}", item.id);
            }
            Err(e) => {
                // Update retry count and last error
                update_retry_metadata(app_handle, &item.id, &e)?;
                log::warn!("Failed to sync {}: {}", item.id, e);
            }
        }
    }
    
    Ok(())
}
```

### 5.6 Integration with Capture Flow

**Update:** `desktop/src-tauri/src/screenshots.rs`

```rust
/// Capture and upload screenshot, queue if offline
#[tauri::command]
pub async fn capture_and_upload(
    app_handle: tauri::AppHandle,
    user_id: i64,
    auth_token: String,
) -> Result<CaptureResult, String> {
    // 1. Capture screenshot
    let image_data = capture_screen_blocking()?;
    
    // 2. Try to upload immediately
    match upload_to_backend(&image_data, user_id, &auth_token).await {
        Ok(response) => {
            Ok(CaptureResult {
                success: true,
                queued: false,
                message: "Screenshot uploaded successfully".to_string(),
            })
        }
        Err(e) => {
            // 3. Upload failed - save to queue
            let id = offline_queue::save_to_queue(&app_handle, user_id, &image_data)?;
            
            Ok(CaptureResult {
                success: true,
                queued: true,
                message: format!("Offline - screenshot queued ({})", id),
            })
        }
    }
}

#[derive(Serialize)]
pub struct CaptureResult {
    pub success: bool,
    pub queued: bool,
    pub message: String,
}
```

### 5.7 Cleanup on Startup

**In:** `desktop/src-tauri/src/main.rs`

```rust
fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle();
            
            // Enforce storage limit on startup
            if let Err(e) = offline_queue::enforce_storage_limit(&handle) {
                log::warn!("Failed to enforce storage limit: {}", e);
            }
            
            // Start background sync worker
            start_sync_worker(handle.clone());
            
            Ok(())
        })
        // ... rest of setup
}
```

---

## Implementation Checklist

### Phase 1: Frontend Fix (Priority: High)
- [x] Create `desktop/src/lib/tauri.ts`
- [x] Update `desktop/src/hooks/useCapture.ts`
- [x] Update `desktop/src/components/BrowserWarning.tsx`
- [x] Remove debug logs from `desktop/src/main.tsx`
- [ ] Test on Windows with Tauri

### Phase 2: Backend Cross-Platform (Priority: High)
- [x] Update `desktop/src-tauri/Cargo.toml` - add xcap, webp, update image
- [x] Rewrite `desktop/src-tauri/src/screenshots.rs` - use xcap + compression
- [ ] Test on Windows
- [ ] Test on macOS (if available)
- [ ] Test on Linux (if available)

### Phase 3: Image Compression (Priority: High)
- [x] Implement `resize_image()` function in screenshots.rs
- [x] Implement `encode_webp()` function in screenshots.rs
- [x] Update `capture_screen_blocking()` to use resize + webp
- [ ] Verify base64 output is valid WebP
- [ ] Test file size reduction (target: 95%+ smaller)
- [x] Update backend to detect/handle WebP format if needed

### Phase 4: Cleanup
- [x] Remove all debug logging code
- [x] Remove unused imports
- [x] Remove conditional compilation (`#[cfg(windows)]`)
- [ ] Update any related documentation

### Phase 5: Offline Queue System (Priority: Medium)
- [x] Create `desktop/src-tauri/src/offline_queue.rs`
- [x] Add `chrono`, `rand`, `reqwest` dependencies to Cargo.toml
- [x] Implement `get_pending_dir()` - cross-platform app data path
- [x] Implement `save_to_queue()` - save screenshot + metadata
- [x] Implement `get_pending_items()` - list pending screenshots
- [x] Implement `remove_from_queue()` - cleanup after upload
- [x] Implement `enforce_storage_limit()` - max 500 MB cleanup
- [x] Implement background sync worker in main.rs (sync.rs)
- [x] Implement `is_online()` health check
- [x] Update `capture_and_upload` to queue on failure
- [ ] Test offline capture → queue → online sync flow
- [ ] Test storage limit enforcement (delete oldest)

---

## Testing Checklist

### Frontend
- [ ] App starts without "browser warning" in Tauri
- [ ] App shows "browser warning" when opened in actual browser (localhost:1420)
- [ ] Screenshot capture button works
- [ ] Auto-capture interval works
- [ ] Keyboard shortcuts work (Ctrl+Shift+S, Ctrl+Shift+C)

### Backend Screenshot
- [ ] Single monitor capture works
- [ ] Multi-monitor capture works (primary only)
- [ ] Base64 output is valid WebP
- [ ] No memory leaks on repeated captures

### Image Compression
- [ ] Output file size is 50-150 KB (not 2-5 MB)
- [ ] Image resolution is max 1440x900
- [ ] Image quality is acceptable for text reading
- [ ] AI vision API accepts the WebP format
- [ ] Upload time is noticeably faster

### Cross-Platform
- [ ] Windows 10: Screenshot works
- [ ] Windows 11: Screenshot works
- [ ] macOS: Screenshot works (with permission prompt)
- [ ] Linux X11: Screenshot works
- [ ] Linux Wayland: Screenshot works (with pipewire)

### Offline Queue
- [ ] Screenshot saved to pending dir when offline
- [ ] Metadata JSON created correctly with all fields
- [ ] Pending screenshots sync when online
- [ ] Successfully synced screenshots removed from queue
- [ ] Storage limit (500 MB) enforced, oldest deleted first
- [ ] Queue persists after app restart
- [ ] Background sync runs every 5 minutes
- [ ] No data loss during sync failures

---

## Rollback Plan

If issues arise:
1. Frontend: Revert to polling-based detection (current BrowserWarning approach but fix useCapture)
2. Backend: Keep conditional compilation, just fix frontend first

---

## References

- xcap: https://github.com/nashaofu/xcap
- webp crate: https://crates.io/crates/webp
- image crate: https://crates.io/crates/image
- Tauri v2 API: https://v2.tauri.app/
- Current screenshots-rs: https://github.com/pot-app/screenshots-rs
- WebP format: https://developers.google.com/speed/webp
