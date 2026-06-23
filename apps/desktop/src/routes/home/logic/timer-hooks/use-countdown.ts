import { RefObject, useCallback, useState } from "react";
import { TIME_TO_SCREENSHOT } from "@/constants/home";
import { stopTimerDriftDetection } from "./timer-drift";

export interface CountdownRefs {
  countdownRef: RefObject<ReturnType<typeof setInterval> | null>;
  nextCaptureAtRef: RefObject<number | null>;
  driftHeartbeatRef: RefObject<ReturnType<typeof setInterval> | null>;
  lastDriftHeartbeatAtRef: RefObject<number | null>;
}

export function useCountdown({
  countdownRef,
  nextCaptureAtRef,
  driftHeartbeatRef,
  lastDriftHeartbeatAtRef,
}: CountdownRefs) {
  const [countdown, setCountdown] = useState(TIME_TO_SCREENSHOT);

  const startCountdown = useCallback((onComplete?: () => void) => {
    if (countdownRef.current) clearInterval(countdownRef.current);

    countdownRef.current = setInterval(() => {
      if (!nextCaptureAtRef.current) return;

      const remaining = Math.max(
        0,
        Math.round((nextCaptureAtRef.current - Date.now()) / 1000),
      );

      setCountdown(remaining);

      if (remaining === 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = null;
        onComplete?.();
      }
    }, 500);
  }, []);

  const clearTimers = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    stopTimerDriftDetection({ driftHeartbeatRef, lastDriftHeartbeatAtRef });
    countdownRef.current = null;
    nextCaptureAtRef.current = null;
  }, []);

  return { countdown, setCountdown, startCountdown, clearTimers };
}
