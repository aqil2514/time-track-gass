import {
  getMonitorScreenshot,
  getScreenshotableMonitors,
} from "tauri-plugin-screenshots-api";
import { invoke } from "@tauri-apps/api/core";
import { platform } from "@tauri-apps/plugin-os";
import { useCallback } from "react";
import { load, Store } from "@tauri-apps/plugin-store";
import {
  checkScreenRecordingPermission,
  requestScreenRecordingPermission,
} from "tauri-plugin-macos-permissions-api";
import { message } from "@tauri-apps/plugin-dialog";

let store: null | Store = null;

const getStore = async () => {
  if (!store) store = await load("compare-capture.json");
  return store;
};

const addToOldStore = async (pathUrl: string) => {
  const s = await getStore();
  await s.set("old_path", pathUrl);
  await s.save();
};

const os = platform();

async function waitForPermission(maxSeconds: number): Promise<boolean> {
  for (let i = 0; i < maxSeconds; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const granted = await checkScreenRecordingPermission();
    if (granted) return true;
  }
  return false;
}

export function useCapture() {
  const capture = useCallback(async () => {
    if (os === "macos") {
      const hasPermission = await checkScreenRecordingPermission();

      if (!hasPermission) {
        await requestScreenRecordingPermission();

        // Poll sampai permission granted atau timeout
        const granted = await waitForPermission(10); // tunggu max 10 detik

        if (!granted) {
          await message(
            "Izin Screen Recording belum terdeteksi. Jika sudah mengaktifkan di System Settings, silakan restart aplikasi.",
            { title: "Permission Diperlukan", kind: "warning" },
          );
          throw new Error("Screen Recording permission belum diaktifkan. Aktifkan di System Settings lalu restart aplikasi.");
        }
      }

      return await invoke<string>("capture_screen_macos");
    }

    const monitors = await getScreenshotableMonitors();
    if (!monitors.length) throw new Error("No monitors found");
    const tempPath = await getMonitorScreenshot(monitors[0].id);
    return await invoke<string>("resize_and_encode", { filePath: tempPath });
  }, []);

  const compareImage = useCallback(async (newPathUrl: string) => {
    const s = await getStore();
    const oldPath = await s.get("old_path");

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
  }, []);

  return { capture, compareImage };
}
