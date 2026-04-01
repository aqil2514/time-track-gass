import {
  getMonitorScreenshot,
  getScreenshotableMonitors,
} from "tauri-plugin-screenshots-api";
import { invoke } from "@tauri-apps/api/core";
import { platform } from "@tauri-apps/plugin-os";
import { useCallback } from "react";

export function useCapture() {
  const capture = useCallback(async () => {
    const os = platform();

    if (os === "macos") {
      const hasPermission = await invoke<boolean>("check_screen_permission_macos");

      if (!hasPermission) {
        await invoke("request_screen_permission_macos");
        throw new Error("Screen Recording permission belum diaktifkan. Aktifkan di System Settings lalu restart aplikasi.");
      }

      return await invoke<string>("capture_screen_macos");
    }

    const monitors = await getScreenshotableMonitors();
    if (!monitors.length) throw new Error("No monitors found");
    const tempPath = await getMonitorScreenshot(monitors[0].id);
    return await invoke<string>("resize_and_encode", { filePath: tempPath });
  }, []);

  return { capture };
}