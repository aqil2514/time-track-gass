use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex, OnceLock};
use std::thread::{self, JoinHandle};
use std::time::Duration;
use tauri::{AppHandle, Emitter};

const TIMER_EVENT_NAME: &str = "native_timer_tick";

struct NativeTimerState {
    stop_signal: Option<Arc<AtomicBool>>,
    handle: Option<JoinHandle<()>>,
}

static NATIVE_TIMER_STATE: OnceLock<Mutex<NativeTimerState>> = OnceLock::new();

fn timer_state() -> &'static Mutex<NativeTimerState> {
    NATIVE_TIMER_STATE.get_or_init(|| {
        Mutex::new(NativeTimerState {
            stop_signal: None,
            handle: None,
        })
    })
}

pub fn start_native_timer(app: AppHandle, interval_seconds: u64) -> Result<(), String> {
    if interval_seconds == 0 {
        return Err("Native timer interval must be greater than zero".to_string());
    }

    let mut state = timer_state()
        .lock()
        .map_err(|_| "Failed to lock native timer state".to_string())?;

    if state.handle.as_ref().is_some_and(|handle| !handle.is_finished()) {
        return Ok(());
    }

    if let Some(handle) = state.handle.take() {
        handle
            .join()
            .map_err(|_| "Failed to join completed native timer thread".to_string())?;
    }

    let stop_signal = Arc::new(AtomicBool::new(false));
    let thread_stop_signal = Arc::clone(&stop_signal);
    let interval = Duration::from_secs(interval_seconds);

    let handle = thread::spawn(move || {
        while !thread_stop_signal.load(Ordering::Relaxed) {
            thread::sleep(interval);

            if thread_stop_signal.load(Ordering::Relaxed) {
                break;
            }

            let _ = app.emit(TIMER_EVENT_NAME, ());
        }
    });

    state.stop_signal = Some(stop_signal);
    state.handle = Some(handle);

    Ok(())
}

pub fn stop_native_timer() -> Result<(), String> {
    let mut state = timer_state()
        .lock()
        .map_err(|_| "Failed to lock native timer state".to_string())?;

    if let Some(stop_signal) = state.stop_signal.take() {
        stop_signal.store(true, Ordering::Relaxed);
    }

    if let Some(handle) = state.handle.take() {
        handle
            .join()
            .map_err(|_| "Failed to join native timer thread".to_string())?;
    }

    Ok(())
}

pub fn is_native_timer_running() -> Result<bool, String> {
    let state = timer_state()
        .lock()
        .map_err(|_| "Failed to lock native timer state".to_string())?;

    Ok(state.handle.as_ref().is_some_and(|handle| !handle.is_finished()))
}
