// [sync.rs] - Background sync worker for offline screenshots

use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;
use tokio::time::interval;
use std::sync::Mutex;
use tauri::AppHandle;
use base64::Engine;
use crate::offline_queue::{self, PendingScreenshot};

static SYNC_RUNNING: AtomicBool = AtomicBool::new(false);
static AUTH_TOKEN: Mutex<Option<String>> = Mutex::new(None);

pub fn set_auth_token(token: String) {
    let mut lock = AUTH_TOKEN.lock().unwrap();
    *lock = Some(token);
}

pub fn get_auth_token() -> Option<String> {
    let lock = AUTH_TOKEN.lock().unwrap();
    lock.clone()
}

pub fn clear_auth_token() {
    let mut lock = AUTH_TOKEN.lock().unwrap();
    *lock = None;
}

/// Start the background sync worker
pub fn start_sync_worker(app_handle: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut interval = interval(Duration::from_secs(300)); // 5 minutes
        
        loop {
            interval.tick().await;
            
            // Skip if already syncing
            if SYNC_RUNNING.swap(true, Ordering::SeqCst) {
                continue;
            }
            
            // Check if we have a token
            if get_auth_token().is_none() {
                SYNC_RUNNING.store(false, Ordering::SeqCst);
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
    // Simple check - try to reach the backend health endpoint
    match reqwest::Client::new()
        .get("http://localhost:8080/api/v1/health") // Assuming health endpoint exists or use basic one
        .timeout(Duration::from_secs(5))
        .send()
        .await
    {
        Ok(_) => true,
        Err(_) => {
            // Fallback: check if we can reach Google or similar if backend is down but internet is up
            match reqwest::Client::new()
                .get("https://8.8.8.8")
                .timeout(Duration::from_secs(2))
                .send()
                .await
            {
                Ok(_) => true,
                Err(_) => false,
            }
        }
    }
}

/// Process all pending screenshots
async fn process_pending_queue(app_handle: &AppHandle) -> Result<(), String> {
    let items = offline_queue::get_pending_items(app_handle)?;
    if items.is_empty() {
        return Ok(());
    }

    log::info!("Found {} pending screenshots to sync", items.len());
    
    for item in items {
        match upload_screenshot(app_handle, &item).await {
            Ok(_) => {
                offline_queue::remove_from_queue(app_handle, &item.id)?;
                log::info!("Synced pending screenshot: {}", item.id);
            }
            Err(e) => {
                // Update retry count and last error
                offline_queue::update_retry_metadata(app_handle, &item.id, &e)?;
                log::warn!("Failed to sync {}: {}", item.id, e);
                
                // If it's an auth error, we should probably stop syncing
                if e.contains("401") || e.contains("unauthorized") {
                    break;
                }
            }
        }
    }
    
    Ok(())
}

async fn upload_screenshot(_app_handle: &AppHandle, item: &PendingScreenshot) -> Result<(), String> {
    let token = get_auth_token().ok_or("No auth token available")?;
    // We do NOT send image data anymore, only metadata
    // let image_data = offline_queue::get_image_data(_app_handle, &item.id)?;
    // let b64 = base64::engine::general_purpose::STANDARD.encode(&image_data);

    let client = reqwest::Client::new();
    let response = client.post("http://localhost:8080/api/v1/activity/upload")
        .header("Authorization", format!("Bearer {}", token))
        .json(&serde_json::json!({
            "captured_at": item.captured_at,
            "app_name": item.app_name,
            "window_title": item.window_title,
            "category": item.category,
            "summary": item.summary
        }))
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("Upload failed with status {}: {}", status, body));
    }

    Ok(())
}
