import { RefObject, useCallback } from "react";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { startNativeTimer, stopNativeTimer } from "./native-timer";
import { writeMacTimerLog } from "./macos-timer-log";

export interface NativeTimerRefs {
  nativeTimerUnlistenRef: RefObject<UnlistenFn | null>;
}

export function useNativeTimerTrigger({ nativeTimerUnlistenRef }: NativeTimerRefs) {
  const startTimerNativeTrigger = useCallback(
    async (onTick: () => void | Promise<void>) => {
      try {
        nativeTimerUnlistenRef.current?.();
        nativeTimerUnlistenRef.current = await listen("native_timer_tick", () => {
          void onTick();
        });
        await startNativeTimer(1);
      } catch (error) {
        await writeMacTimerLog(
          "mac_timer_native_timer_start_failed",
          { errorMessage: error instanceof Error ? error.message : String(error) },
          "ERROR",
        );
      }
    },
    [],
  );

  const stopTimerNativeTrigger = useCallback(async () => {
    try {
      nativeTimerUnlistenRef.current?.();
      nativeTimerUnlistenRef.current = null;
      await stopNativeTimer();
    } catch (error) {
      await writeMacTimerLog(
        "mac_timer_native_timer_stop_failed",
        { errorMessage: error instanceof Error ? error.message : String(error) },
        "ERROR",
      );
    }
  }, []);

  return { startTimerNativeTrigger, stopTimerNativeTrigger };
}
