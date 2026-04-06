import {
  getMonitorScreenshot,
  getScreenshotableMonitors,
} from "tauri-plugin-screenshots-api";
import { invoke } from "@tauri-apps/api/core";
import { platform } from "@tauri-apps/plugin-os";
import { useCallback } from "react";
import { load, Store } from "@tauri-apps/plugin-store";

let store: null | Store = null;

const getStore = async () => {
  if(!store)
    store = await load("compare-capture.json")
  return store
}

const addToOldStore = async (pathUrl: string) => {
  const store = await getStore()
  await store.set("old_path", pathUrl);
  await store.save();
};

export function useCapture() {
  const capture = useCallback(async () => {
    const os = platform();

    if (os === "macos") {
      const hasPermission = await invoke<boolean>(
        "check_screen_permission_macos",
      );

      if (!hasPermission) {
        await invoke("request_screen_permission_macos");
        throw new Error(
          "Screen Recording permission belum diaktifkan. Aktifkan di System Settings lalu restart aplikasi.",
        );
      }

      return await invoke<string>("capture_screen_macos");
    }

    const monitors = await getScreenshotableMonitors();
    if (!monitors.length) throw new Error("No monitors found");
    const tempPath = await getMonitorScreenshot(monitors[0].id);
    return await invoke<string>("resize_and_encode", { filePath: tempPath });
  }, []);

  const compareImage = async (newPathUrl: string) => {
    const store = await load("compare-capture.json");
    const oldPath = await store.get("old_path");
    if (!oldPath) {
      await addToOldStore(newPathUrl);
      return false;
    }

    const isSameImage = await invoke<boolean>("check_if_images_match", {
      pathA: oldPath,
      pathB: newPathUrl,
    });

    await addToOldStore(newPathUrl);

    return isSameImage;
  };

  return { capture, compareImage };
}
