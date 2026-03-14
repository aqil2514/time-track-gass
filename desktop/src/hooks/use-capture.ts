import {
  getMonitorScreenshot,
  getScreenshotableMonitors,
} from "tauri-plugin-screenshots-api";
import { invoke } from "@tauri-apps/api/core";
import { useCallback } from "react";

export function useCapture() {
  const capture = useCallback(async () => {
    const monitors = await getScreenshotableMonitors();
    if (!monitors.length) throw new Error("No monitors found");

    const tempPath = await getMonitorScreenshot(monitors[0].id);
    const dataUrl = await invoke<string>("resize_and_encode", {
      filePath: tempPath,
    });

    return dataUrl;
  }, []);

  return { capture };
}
