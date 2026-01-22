// [offline_queue.rs] - Handles offline screenshot storage and sync

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use chrono;
use rand::Rng;
use tauri::Manager;

const MAX_QUEUE_SIZE_BYTES: u64 = 500 * 1024 * 1024; // 500 MB

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PendingScreenshot {
    pub id: String,
    pub user_id: String,
    pub captured_at: String,
    pub app_name: String,
    pub window_title: String,
    pub category: String,
    pub summary: String,
    pub retry_count: u32,
    pub last_attempt: Option<String>,
    pub last_error: Option<String>,
    pub file_size_bytes: u64,
}

/// Get the pending queue directory path
pub fn get_pending_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data = app_handle.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    let pending_dir = app_data.join("pending");
    
    // Create directory if not exists
    fs::create_dir_all(&pending_dir)
        .map_err(|e| format!("Failed to create pending dir: {}", e))?;
    
    Ok(pending_dir)
}

/// Save a screenshot to the pending queue
pub fn save_to_queue(
    app_handle: &tauri::AppHandle,
    user_id: String,
    image_data: &[u8],
    app_name: String,
    window_title: String,
    category: String,
    summary: String,
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
        app_name,
        window_title,
        category,
        summary,
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
    if let Err(e) = enforce_storage_limit(app_handle) {
        log::error!("Failed to enforce storage limit: {}", e);
    }
    
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

/// Update retry metadata for a pending item
pub fn update_retry_metadata(app_handle: &tauri::AppHandle, id: &str, error: &str) -> Result<(), String> {
    let pending_dir = get_pending_dir(app_handle)?;
    
    for entry in fs::read_dir(&pending_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let file_name = path.file_stem().and_then(|s| s.to_str()).unwrap_or("");
        
        if file_name.ends_with(id) && path.extension().map_or(false, |ext| ext == "json") {
            let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
            if let Ok(mut meta) = serde_json::from_str::<PendingScreenshot>(&content) {
                meta.retry_count += 1;
                meta.last_attempt = Some(chrono::Local::now().to_rfc3339());
                meta.last_error = Some(error.to_string());
                
                let meta_json = serde_json::to_string_pretty(&meta)
                    .map_err(|e| format!("Failed to serialize metadata: {}", e))?;
                fs::write(&path, meta_json)
                    .map_err(|e| format!("Failed to save metadata: {}", e))?;
                return Ok(());
            }
        }
    }
    
    Err(format!("Item with id {} not found", id))
}

/// Get the image data for a pending item
pub fn get_image_data(app_handle: &tauri::AppHandle, id: &str) -> Result<Vec<u8>, String> {
    let pending_dir = get_pending_dir(app_handle)?;
    
    for entry in fs::read_dir(&pending_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let file_name = path.file_stem().and_then(|s| s.to_str()).unwrap_or("");
        
        if file_name.ends_with(id) && path.extension().map_or(false, |ext| ext == "webp") {
            return fs::read(&path).map_err(|e| format!("Failed to read image: {}", e));
        }
    }
    
    Err(format!("Image with id {} not found", id))
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
