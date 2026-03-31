use base64::Engine;
use image::imageops::FilterType;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

#[tauri::command]
async fn resize_and_encode(file_path: String) -> Result<String, String> {
    let img = image::open(&file_path).map_err(|e| format!("Failed to open image: {e}"))?;

    let max_width = 1440u32;
    let max_height = 900u32;
    let (w, h) = (img.width(), img.height());

    let img = if w > max_width || h > max_height {
        let ratio = (max_width as f64 / w as f64).min(max_height as f64 / h as f64);
        let new_w = (w as f64 * ratio) as u32;
        let new_h = (h as f64 * ratio) as u32;
        img.resize(new_w, new_h, FilterType::CatmullRom)
    } else {
        img
    };

    let rgba = img.to_rgba8();
    let (w, h) = (rgba.width(), rgba.height());

    let encoder = webp::Encoder::from_rgba(&rgba, w, h);
    let webp_data = encoder.encode(70.0);

    let b64 = base64::engine::general_purpose::STANDARD.encode(&*webp_data);

    if let Err(e) = std::fs::remove_file(&file_path) {
        eprintln!("Warning: failed to clean up temp file {file_path}: {e}");
    }

    Ok(format!("data:image/webp;base64,{b64}"))
}

#[tauri::command]
async fn capture_screen_macos() -> Result<String, String> {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();

    let temp_path = format!("/tmp/screenshot_{}.png", timestamp);

    let output = Command::new("screencapture")
        .args(["-x", "-t", "png", &temp_path])
        .output()
        .map_err(|e| format!("Failed to run screencapture: {e}"))?;

    if !output.status.success() {
        return Err(format!(
            "screencapture failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    let img = image::open(&temp_path).map_err(|e| format!("Failed to open image: {e}"))?;

    let max_width = 1440u32;
    let max_height = 900u32;
    let (w, h) = (img.width(), img.height());

    let img = if w > max_width || h > max_height {
        let ratio = (max_width as f64 / w as f64).min(max_height as f64 / h as f64);
        let new_w = (w as f64 * ratio) as u32;
        let new_h = (h as f64 * ratio) as u32;
        img.resize(new_w, new_h, FilterType::CatmullRom)
    } else {
        img
    };

    let rgba = img.to_rgba8();
    let (w, h) = (rgba.width(), rgba.height());
    let encoder = webp::Encoder::from_rgba(&rgba, w, h);
    let webp_data = encoder.encode(70.0);
    let b64 = base64::engine::general_purpose::STANDARD.encode(&*webp_data);

    let _ = std::fs::remove_file(&temp_path);

    Ok(format!("data:image/webp;base64,{b64}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_screenshots::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            resize_and_encode,
            capture_screen_macos,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}