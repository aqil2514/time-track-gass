import { invoke } from "@tauri-apps/api/core";

export const startKeepAwake = async () => {
  await invoke("start_keep_awake");
};

export const stopKeepAwake = async () => {
  await invoke("stop_keep_awake");
};

export const isKeepAwakeRunning = async () => {
  return await invoke<boolean>("is_keep_awake_running");
};

export const startNativeTimer = async (intervalSeconds: number) => {
  await invoke("start_native_timer", { intervalSeconds });
};

export const stopNativeTimer = async () => {
  await invoke("stop_native_timer");
};

export const isNativeTimerRunning = async () => {
  return await invoke<boolean>("is_native_timer_running");
};
