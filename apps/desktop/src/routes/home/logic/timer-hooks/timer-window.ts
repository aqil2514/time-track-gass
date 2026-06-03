import { getCurrentWindow } from "@tauri-apps/api/window";

export const bringWindowToFront = async () => {
  try {
    const window = getCurrentWindow();
    await window.show();
    await window.unminimize();
    await window.setFocus();
  } catch (error) {
    console.error("[captureHandler] failed to focus window", error);
  }
};
