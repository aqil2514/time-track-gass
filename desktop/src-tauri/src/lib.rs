// Prevents additional console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;


mod screenshots;
mod offline_queue;
mod sync;

#[tauri::command(rename_all = "snake_case")]
fn start_capture(app_handle: tauri::AppHandle, interval_minutes: u32) -> Result<(), String> {
    tauri::async_runtime::block_on(screenshots::start_capture(app_handle, interval_minutes))
}

#[tauri::command]
fn stop_capture() -> Result<(), String> {
    tauri::async_runtime::block_on(screenshots::stop_capture())
}

#[tauri::command]
fn capture_screenshot() -> Result<String, String> {
    tauri::async_runtime::block_on(screenshots::capture_screen())
}

#[tauri::command]
fn is_capturing() -> Result<bool, String> {
    tauri::async_runtime::block_on(screenshots::is_capturing())
}

#[tauri::command]
fn get_capture_interval() -> Result<u32, String> {
    tauri::async_runtime::block_on(screenshots::get_capture_interval())
}

#[tauri::command]
fn set_auth_token(token: String) -> Result<(), String> {
    sync::set_auth_token(token);
    Ok(())
}

#[tauri::command]
fn clear_auth_token() -> Result<(), String> {
    sync::clear_auth_token();
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
fn save_offline_screenshot(
    app_handle: tauri::AppHandle,
    user_id: String,
    image_b64: String,
    app_name: String,
    window_title: String,
    category: String,
    summary: String
) -> Result<(), String> {
    screenshots::save_offline_screenshot(app_handle, user_id, image_b64, app_name, window_title, category, summary)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            start_capture,
            stop_capture,
            capture_screenshot,
            is_capturing,
            get_capture_interval,
            set_auth_token,
            clear_auth_token,
            save_offline_screenshot
        ])
        .setup(|app| {
            // Start sync worker
            sync::start_sync_worker(app.handle().clone());
            #[cfg(desktop)]
            {
                use tauri::menu::{Menu, MenuItem};
                use tauri::tray::TrayIconBuilder;

                let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
                let show_i = MenuItem::with_id(app, "show", "Show TimeTrack", true, None::<&str>)?;
                let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

                let _tray = TrayIconBuilder::new()
                    .icon(app.default_window_icon().unwrap().clone())
                    .menu(&menu)
                    .on_menu_event(|app, event| match event.id.as_ref() {
                        "quit" => {
                            app.exit(0);
                        }
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        _ => {}
                    })
                    .on_tray_icon_event(|tray, event| {
                        if let tauri::tray::TrayIconEvent::Click {
                            button: tauri::tray::MouseButton::Left,
                            ..
                        } = event
                        {
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    })
                    .build(app)?;
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                window.hide().unwrap();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
