import { Button } from "@/components/ui/button";
import {
  isKeepAwakeRunning,
  isNativeTimerRunning,
  startKeepAwake,
  startNativeTimer,
  stopKeepAwake,
  stopNativeTimer,
} from "../../logic/timer-hooks/native-timer";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";

const DEV_TIMER_SECONDS = 10;

export function NativeTimerDevControls() {
  const [keepAwakeRunning, setKeepAwakeRunning] = useState(false);
  const [nativeTimerRunning, setNativeTimerRunning] = useState(false);
  const [tickCount, setTickCount] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(DEV_TIMER_SECONDS);
  const unlistenRef = useRef<UnlistenFn | null>(null);

  const refreshStatus = async () => {
    setKeepAwakeRunning(await isKeepAwakeRunning());
    setNativeTimerRunning(await isNativeTimerRunning());
  };

  const startDevTimer = async () => {
    setTickCount(0);
    setRemainingSeconds(DEV_TIMER_SECONDS);
    await startKeepAwake();
    await startNativeTimer(1);
    await refreshStatus();
  };

  const stopDevTimer = async () => {
    await stopNativeTimer();
    await stopKeepAwake();
    setRemainingSeconds(DEV_TIMER_SECONDS);
    await refreshStatus();
  };

  useEffect(() => {
    void refreshStatus();

    void listen("native_timer_tick", () => {
      setTickCount((value) => value + 1);
      setRemainingSeconds((value) => {
        if (value <= 1) {
          console.log("[native-timer-dev] countdown reached 0");
          return DEV_TIMER_SECONDS;
        }
        return value - 1;
      });
    }).then((unlisten) => {
      unlistenRef.current = unlisten;
    });

    return () => {
      unlistenRef.current?.();
      void stopDevTimer();
    };
  }, []);

  if (!import.meta.env.DEV) return null;

  return (
    <div className="flex items-center gap-2 rounded-md border border-dashed border-amber-500 p-2 text-xs text-amber-700">
      <span>Native timer dev</span>
      <Button size="sm" variant="outline" onClick={startDevTimer}>
        Start
      </Button>
      <Button size="sm" variant="outline" onClick={stopDevTimer}>
        Stop
      </Button>
      <span>keepAwake: {keepAwakeRunning ? "on" : "off"}</span>
      <span>timer: {nativeTimerRunning ? "on" : "off"}</span>
      <span>remaining: {remainingSeconds}s</span>
      <span>ticks: {tickCount}</span>
    </div>
  );
}
