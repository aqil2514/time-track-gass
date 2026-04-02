// import {
//   getMonitorScreenshot,
//   getScreenshotableMonitors,
// } from "tauri-plugin-screenshots-api";
// import { invoke } from "@tauri-apps/api/core";
// import { platform } from "@tauri-apps/plugin-os";
// import { useCallback } from "react";

// export function useCapture() {
//   const capture = useCallback(async () => {
//     const os = platform();

//     if (os === "macos") {
//       const hasPermission = await invoke<boolean>("check_screen_permission_macos");

//       if (!hasPermission) {
//         await invoke("request_screen_permission_macos");
//         throw new Error("Screen Recording permission belum diaktifkan. Aktifkan di System Settings lalu restart aplikasi.");
//       }

//       return await invoke<string>("capture_screen_macos");
//     }

//     const monitors = await getScreenshotableMonitors();
//     if (!monitors.length) throw new Error("No monitors found");
//     const tempPath = await getMonitorScreenshot(monitors[0].id);
//     return await invoke<string>("resize_and_encode", { filePath: tempPath });
//   }, []);

//   return { capture };
// }

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
    console.log("[capture] platform:", os);

    if (os === "macos") {
      console.log("[capture] masuk flow macOS");

      let hasPermission = false;
      try {
        hasPermission = await invoke<boolean>("check_screen_permission_macos");
        console.log("[capture] hasPermission:", hasPermission);
      } catch (e) {
        console.error("[capture] gagal invoke check_screen_permission_macos:", e);
      }

      if (!hasPermission) {
        console.warn("[capture] permission tidak ada, membuka System Settings...");
        try {
          await invoke("request_screen_permission_macos");
        } catch (e) {
          console.error("[capture] gagal invoke request_screen_permission_macos:", e);
        }
        throw new Error("Screen Recording permission belum diaktifkan. Aktifkan di System Settings lalu restart aplikasi.");
      }

      console.log("[capture] permission OK, menjalankan capture_screen_macos...");
      try {
        const result = await invoke<string>("capture_screen_macos");
        console.log("[capture] capture_screen_macos berhasil, panjang data:", result.length);
        return result;
      } catch (e) {
        console.error("[capture] capture_screen_macos gagal:", e);
        throw e;
      }
    }

    console.log("[capture] masuk flow non-macOS");
    try {
      const monitors = await getScreenshotableMonitors();
      console.log("[capture] monitors:", monitors.length, monitors);

      if (!monitors.length) throw new Error("No monitors found");

      const tempPath = await getMonitorScreenshot(monitors[0].id);
      console.log("[capture] tempPath:", tempPath);

      const result = await invoke<string>("resize_and_encode", { filePath: tempPath });
      console.log("[capture] resize_and_encode berhasil, panjang data:", result.length);
      return result;
    } catch (e) {
      console.error("[capture] flow non-macOS gagal:", e);
      throw e;
    }
  }, []);

  return { capture };
}