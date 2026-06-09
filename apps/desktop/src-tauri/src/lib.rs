use base64::Engine;
use image::imageops::FilterType;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

mod utils;

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

    // Validasi file benar-benar ter-capture (bukan blank akibat permission ditolak)
    let file_size = std::fs::metadata(&temp_path).map(|m| m.len()).unwrap_or(0);

    if file_size < 1000 {
        let _ = std::fs::remove_file(&temp_path);
        return Err("screencapture menghasilkan file kosong. Kemungkinan Screen Recording permission belum diaktifkan.".to_string());
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

#[tauri::command]
async fn check_screen_permission_macos() -> bool {
    let test_path = "/tmp/permission_test.png";

    let output = Command::new("screencapture")
        .args(["-x", "-t", "png", test_path])
        .output();

    match output {
        Ok(o) if o.status.success() => {
            // File kosong/kecil = permission ditolak macOS
            let valid = std::fs::metadata(test_path)
                .map(|m| m.len() > 1000)
                .unwrap_or(false);
            let _ = std::fs::remove_file(test_path);
            valid
        }
        _ => false,
    }
}

#[tauri::command]
async fn request_screen_permission_macos() -> Result<(), String> {
    Command::new("open")
        .args(["x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"])
        .spawn()
        .map_err(|e| format!("Failed to open settings: {e}"))?;
    Ok(())
}

#[tauri::command]
async fn check_if_images_match(path_a: String, path_b: String) -> bool {
    utils::compare_image::is_identical(&path_a, &path_b)
}

#[tauri::command]
fn start_keep_awake() -> Result<(), String> {
    utils::keep_awake::start_keep_awake()
}

#[tauri::command]
fn stop_keep_awake() -> Result<(), String> {
    utils::keep_awake::stop_keep_awake()
}

#[tauri::command]
fn is_keep_awake_running() -> Result<bool, String> {
    utils::keep_awake::is_keep_awake_running()
}

#[tauri::command]
fn start_native_timer(app: tauri::AppHandle, interval_seconds: u64) -> Result<(), String> {
    utils::native_timer::start_native_timer(app, interval_seconds)
}

#[tauri::command]
fn stop_native_timer() -> Result<(), String> {
    utils::native_timer::stop_native_timer()
}

#[tauri::command]
fn is_native_timer_running() -> Result<bool, String> {
    utils::native_timer::is_native_timer_running()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_macos_permissions::init())
        .plugin(tauri_plugin_shell::init())
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
            check_screen_permission_macos,
            request_screen_permission_macos,
            check_if_images_match,
            start_keep_awake,
            stop_keep_awake,
            is_keep_awake_running,
            start_native_timer,
            stop_native_timer,
            is_native_timer_running,
        ])
        .on_window_event(|_window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                let _ = utils::keep_awake::stop_keep_awake();
                let _ = utils::native_timer::stop_native_timer();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
