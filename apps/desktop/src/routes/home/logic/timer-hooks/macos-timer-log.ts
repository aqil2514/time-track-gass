import { writeLogToDb } from "@/utils/write-log-to-db";
import { platform } from "@tauri-apps/plugin-os";

const os = platform();

export const writeMacTimerLog = async (
  message: string,
  metadata: Record<string, unknown> = {},
  level = "INFO",
) => {
  if (os !== "macos") return;

  try {
    await writeLogToDb({
      context: "useHomeTimerController:macos",
      level,
      message,
      metadata,
    });
  } catch (error) {
    console.error("[useHomeTimerController] failed to write macOS timer log", error);
  }
};
