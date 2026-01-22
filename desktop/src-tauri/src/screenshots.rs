use base64::Engine;
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::thread;
use std::time::Duration;
use xcap::Monitor;
use image::{DynamicImage, imageops::FilterType};
use webp::Encoder;
use tauri::{AppHandle, Emitter};
use crate::offline_queue;

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

/// Capture a screenshot - cross-platform (Windows, macOS, Linux)
/// Returns (image_data, base64_string)
fn capture_screen_blocking_raw() -> Result<(Vec<u8>, String), String> {
    let monitors = Monitor::all().map_err(|e| format!("Failed to get monitors: {}", e))?;

    if monitors.is_empty() {
        return Err("No monitors found".to_string());
    }

    // Find primary monitor, fallback to first
    let monitor = monitors
        .into_iter()
        .find(|m| m.is_primary())
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

    let b64 = base64::engine::general_purpose::STANDARD.encode(&webp_data);
    Ok((webp_data, b64))
}

/// Start automatic screenshot capture
pub async fn start_capture(app_handle: AppHandle, interval_minutes: u32) -> Result<(), String> {
    if CAPTURE_STATE.is_capturing() {
        return Err("Capture already running".to_string());
    }

    CAPTURE_STATE.set_interval(interval_minutes);
    CAPTURE_STATE.set_capturing(true);

    let interval_secs = interval_minutes as u64 * 60;
    // Clone app handle for the thread
    let app_handle_clone = app_handle.clone();

    thread::spawn(move || loop {
        // Check stop flag before capturing
        if !CAPTURE_STATE.is_capturing() {
            break;
        }
        
        // Capture screenshot
        match capture_screen_blocking_raw() {
            Ok((_data, b64)) => {
                // Emit to frontend to handle the upload
                if let Err(e) = app_handle_clone.emit("screenshot-captured", &b64) {
                    eprintln!("Failed to emit screenshot event: {}", e);
                }
            }
            Err(e) => {
                eprintln!("Screenshot capture failed: {}", e);
            }
        }
        
        // Sleep in short increments to allow responsive stop
        // Check every second if we should stop
        for _ in 0..interval_secs {
            if !CAPTURE_STATE.is_capturing() {
                return; // Exit the thread immediately
            }
            thread::sleep(Duration::from_secs(1));
        }
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

/// Capture a screenshot and return as base64 encoded WebP
pub async fn capture_screen() -> Result<String, String> {
    let (_data, b64) = capture_screen_blocking_raw()?;
    Ok(b64)
}

pub fn save_offline_screenshot(
    app_handle: AppHandle,
    user_id: String,
    image_b64: String,
    app_name: String,
    window_title: String,
    category: String,
    summary: String,
) -> Result<(), String> {
    let data = base64::engine::general_purpose::STANDARD.decode(image_b64)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;
    
    offline_queue::save_to_queue(&app_handle, user_id, &data, app_name, window_title, category, summary)?;
    Ok(())
}
