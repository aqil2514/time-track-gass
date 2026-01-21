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

use tauri::{AppHandle, Emitter};

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
/// Captures all monitors and combines them into a single image
fn capture_screen_blocking() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        use screenshots::Screen;
        use image::{RgbaImage, ImageBuffer};

        let screens = Screen::all().map_err(|e| e.to_string())?;
        
        if screens.is_empty() {
            return Err("No screens found".to_string());
        }

        // If only one screen, optimize by not creating a combined canvas
        if screens.len() == 1 {
            let screen = &screens[0];
            let image = screen.capture().map_err(|e| e.to_string())?;
            let buffer = image.to_png(None).map_err(|e| e.to_string())?;
            return Ok(base64::engine::general_purpose::STANDARD.encode(&buffer));
        }

        // Calculate the bounding box for all screens
        let mut min_x = i32::MAX;
        let mut min_y = i32::MAX;
        let mut max_x = i32::MIN;
        let mut max_y = i32::MIN;

        for screen in &screens {
            let info = screen.display_info;
            min_x = min_x.min(info.x);
            min_y = min_y.min(info.y);
            max_x = max_x.max(info.x + info.width as i32);
            max_y = max_y.max(info.y + info.height as i32);
        }

        let total_width = (max_x - min_x) as u32;
        let total_height = (max_y - min_y) as u32;

        // Create a blank canvas for the combined screenshot
        let mut canvas: RgbaImage = ImageBuffer::new(total_width, total_height);

        // Capture each screen and paste onto the canvas
        for screen in &screens {
            let info = screen.display_info;
            let capture = screen.capture().map_err(|e| format!("Failed to capture screen {}: {}", info.id, e))?;
            
            // Calculate position on canvas (offset by min_x, min_y to handle negative coords)
            let x_offset = (info.x - min_x) as u32;
            let y_offset = (info.y - min_y) as u32;

            // Get raw RGBA pixels from the capture
            let rgba_data = capture.rgba();
            let width = capture.width();
            let height = capture.height();

            // Copy pixels to canvas
            for py in 0..height {
                for px in 0..width {
                    let idx = ((py * width + px) * 4) as usize;
                    if idx + 3 < rgba_data.len() {
                        let pixel = image::Rgba([
                            rgba_data[idx],
                            rgba_data[idx + 1],
                            rgba_data[idx + 2],
                            rgba_data[idx + 3],
                        ]);
                        let canvas_x = x_offset + px;
                        let canvas_y = y_offset + py;
                        if canvas_x < total_width && canvas_y < total_height {
                            canvas.put_pixel(canvas_x, canvas_y, pixel);
                        }
                    }
                }
            }
        }

        // Encode the combined image to PNG
        let mut png_buffer: Vec<u8> = Vec::new();
        {
            use image::codecs::png::PngEncoder;
            use image::ImageEncoder;
            let encoder = PngEncoder::new(&mut png_buffer);
            encoder
                .write_image(
                    canvas.as_raw(),
                    total_width,
                    total_height,
                    image::ColorType::Rgba8,
                )
                .map_err(|e| format!("Failed to encode PNG: {}", e))?;
        }

        Ok(base64::engine::general_purpose::STANDARD.encode(&png_buffer))
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Screenshot capture only supported on Windows for now".to_string())
    }
}
