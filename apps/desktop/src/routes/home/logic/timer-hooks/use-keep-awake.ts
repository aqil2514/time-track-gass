import { useCallback } from "react";
import { startKeepAwake, stopKeepAwake } from "./native-timer";
import { writeMacTimerLog } from "./macos-timer-log";

export function useKeepAwake() {
  const startTimerKeepAwake = useCallback(async () => {
    try {
      await startKeepAwake();
    } catch (error) {
      await writeMacTimerLog(
        "mac_timer_keep_awake_start_failed",
        { errorMessage: error instanceof Error ? error.message : String(error) },
        "ERROR",
      );
    }
  }, []);

  const stopTimerKeepAwake = useCallback(async () => {
    try {
      await stopKeepAwake();
    } catch (error) {
      await writeMacTimerLog(
        "mac_timer_keep_awake_stop_failed",
        { errorMessage: error instanceof Error ? error.message : String(error) },
        "ERROR",
      );
    }
  }, []);

  return { startTimerKeepAwake, stopTimerKeepAwake };
}
