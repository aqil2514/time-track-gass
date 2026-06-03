#[cfg(target_os = "macos")]
use std::process::{Child, Command, Stdio};
#[cfg(target_os = "macos")]
use std::sync::{Mutex, OnceLock};

#[cfg(target_os = "macos")]
static CAFFEINATE_PROCESS: OnceLock<Mutex<Option<Child>>> = OnceLock::new();

#[cfg(target_os = "macos")]
fn process_state() -> &'static Mutex<Option<Child>> {
    CAFFEINATE_PROCESS.get_or_init(|| Mutex::new(None))
}

#[cfg(target_os = "macos")]
pub fn start_keep_awake() -> Result<(), String> {
    let mut process = process_state()
        .lock()
        .map_err(|_| "Failed to lock keep-awake process state".to_string())?;

    if let Some(child) = process.as_mut() {
        if child.try_wait().map_err(|error| error.to_string())?.is_none() {
            return Ok(());
        }
    }

    let child = Command::new("caffeinate")
        .args(["-d", "-i", "-u"])
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|error| error.to_string())?;

    *process = Some(child);

    Ok(())
}

#[cfg(not(target_os = "macos"))]
pub fn start_keep_awake() -> Result<(), String> {
    Ok(())
}

#[cfg(target_os = "macos")]
pub fn stop_keep_awake() -> Result<(), String> {
    let mut process = process_state()
        .lock()
        .map_err(|_| "Failed to lock keep-awake process state".to_string())?;

    if let Some(mut child) = process.take() {
        child.kill().map_err(|error| error.to_string())?;
        child.wait().map_err(|error| error.to_string())?;
    }

    Ok(())
}

#[cfg(not(target_os = "macos"))]
pub fn stop_keep_awake() -> Result<(), String> {
    Ok(())
}

#[cfg(target_os = "macos")]
pub fn is_keep_awake_running() -> Result<bool, String> {
    let mut process = process_state()
        .lock()
        .map_err(|_| "Failed to lock keep-awake process state".to_string())?;

    match process.as_mut() {
        Some(child) => Ok(child.try_wait().map_err(|error| error.to_string())?.is_none()),
        None => Ok(false),
    }
}

#[cfg(not(target_os = "macos"))]
pub fn is_keep_awake_running() -> Result<bool, String> {
    Ok(false)
}
