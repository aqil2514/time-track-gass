use base64::Engine;
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::thread;
use std::time::Duration;

/// Global screenshot capture service state
static CAPTURE_STATE: CaptureState = CaptureState::new();

struct CaptureState {
    is_capturing: AtomicBool,
    interval_minutes: AtomicU32,
}

impl CaptureState {
    const fn new() -> Self {
        Self {
            is_capturing: AtomicBool::new(false),
            interval_minutes: AtomicU32::new(5),
        }
    }

    fn is_capturing(&self) -> bool {
        self.is_capturing.load(Ordering::Acquire)
    }

    fn set_capturing(&self, value: bool) {
        self.is_capturing.store(value, Ordering::Release);
    }

    fn get_interval(&self) -> u32 {
        self.interval_minutes.load(Ordering::Acquire)
    }

    fn set_interval(&self, value: u32) {
        self.interval_minutes.store(value, Ordering::Release);
    }
}

use tauri::{AppHandle, Manager, Emitter};

/// Start automatic screenshot capture
pub async fn start_capture(app_handle: AppHandle, interval_minutes: u32) -> Result<(), String> {
    if CAPTURE_STATE.is_capturing() {
        return Err("Capture already running".to_string());
    }

    CAPTURE_STATE.set_interval(interval_minutes);
    CAPTURE_STATE.set_capturing(true);

    let interval = Duration::from_secs(interval_minutes as u64 * 60);
    // Clone app handle for the thread
    let app_handle = app_handle.clone();

    thread::spawn(move || loop {
        if !CAPTURE_STATE.is_capturing() {
            break;
        }
        // Capture screenshot (blocking version)
        match capture_screen_blocking() {
            Ok(base64_data) => {
                // Emit event to frontend
                if let Err(e) = app_handle.emit("screenshot-captured", &base64_data) {
                    eprintln!("Failed to emit screenshot event: {}", e);
                }
            }
            Err(e) => {
                eprintln!("Screenshot capture failed: {}", e);
            }
        }
        thread::sleep(interval);
    });

    Ok(())
}

/// Stop automatic screenshot capture
pub async fn stop_capture() -> Result<(), String> {
    CAPTURE_STATE.set_capturing(false);
    Ok(())
}

/// Check if currently capturing
pub async fn is_capturing() -> Result<bool, String> {
    Ok(CAPTURE_STATE.is_capturing())
}

/// Get the current capture interval in minutes
pub async fn get_capture_interval() -> Result<u32, String> {
    Ok(CAPTURE_STATE.get_interval())
}

/// Capture a screenshot and return as base64 encoded PNG
pub async fn capture_screen() -> Result<String, String> {
    capture_screen_blocking()
}

/// Blocking version of capture_screen for use in threads
/// Blocking version of capture_screen for use in threads
fn capture_screen_blocking() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        use screenshots::Screen;

        let screens = Screen::all().map_err(|e| e.to_string())?;
        let screen = screens.first().ok_or("No screen found")?;
        
        let image = screen.capture().map_err(|e| e.to_string())?;
        let buffer = image.to_png(None).map_err(|e| e.to_string())?;
        
        let base64 = base64::engine::general_purpose::STANDARD.encode(&buffer);
        Ok(base64)
    }

    #[cfg(not(target_os = "windows"))]
    {
        // Fallback for non-windows (though dependecy is windows only in cargo.toml currently)
        Err("Screenshot capture only supported on Windows for now".to_string())
    }
}

/// Get the application name of the active window
pub async fn get_active_window() -> Result<String, String> {
    // Real implementation would query active window
    Ok("TimeTrack Desktop".to_string())
}

/// Get the window title of the active window
pub async fn get_window_title() -> Result<String, String> {
    // Real implementation would query active window title
    Ok("TimeTrack Desktop App".to_string())
}
