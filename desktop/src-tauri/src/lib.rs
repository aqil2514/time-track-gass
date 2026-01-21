// Prevents additional console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;


mod screenshots;

#[tauri::command]
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            start_capture,
            stop_capture,
            capture_screenshot,
            is_capturing,
            get_capture_interval
        ])
        .setup(|app| {
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
