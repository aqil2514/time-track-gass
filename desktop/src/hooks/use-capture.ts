import {
  getMonitorScreenshot,
  getScreenshotableMonitors,
} from "tauri-plugin-screenshots-api";
import { useCallback } from "react";

export function useCapture() {
  const capture = useCallback(async () => {
    const monitors = await getScreenshotableMonitors();
    if (!monitors.length) return;

    const tempPath = await getMonitorScreenshot(monitors[0].id);

    return tempPath;
  }, []);

  return { capture };
}
