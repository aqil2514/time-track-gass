import { RefObject } from "react";
import { TimerStatus } from "./use-home-timer-controller";
import { writeMacTimerLog } from "./macos-timer-log";

const DRIFT_HEARTBEAT_INTERVAL_MS = 10_000;
const DRIFT_THRESHOLD_MS = 60_000;

type StartTimerDriftDetectionParams = {
  driftHeartbeatRef: RefObject<ReturnType<typeof setInterval> | null>;
  lastDriftHeartbeatAtRef: RefObject<number | null>;
  nextCaptureAtRef: RefObject<number | null>;
  getStatus: () => TimerStatus;
};

export const startTimerDriftDetection = ({
  driftHeartbeatRef,
  lastDriftHeartbeatAtRef,
  nextCaptureAtRef,
  getStatus,
}: StartTimerDriftDetectionParams) => {
  stopTimerDriftDetection({ driftHeartbeatRef, lastDriftHeartbeatAtRef });

  lastDriftHeartbeatAtRef.current = Date.now();
  driftHeartbeatRef.current = setInterval(() => {
    const lastHeartbeatAt = lastDriftHeartbeatAtRef.current;
    const now = Date.now();

    if (!lastHeartbeatAt) {
      lastDriftHeartbeatAtRef.current = now;
      return;
    }

    const actualGapMs = now - lastHeartbeatAt;
    const driftMs = actualGapMs - DRIFT_HEARTBEAT_INTERVAL_MS;

    if (driftMs > DRIFT_THRESHOLD_MS) {
      void writeMacTimerLog(
        "mac_timer_drift_detected",
        {
          expectedGapMs: DRIFT_HEARTBEAT_INTERVAL_MS,
          actualGapMs,
          driftMs,
          nextCaptureAt: nextCaptureAtRef.current,
          status: getStatus(),
        },
        "WARN",
      );
    }

    lastDriftHeartbeatAtRef.current = now;
  }, DRIFT_HEARTBEAT_INTERVAL_MS);
};

export const stopTimerDriftDetection = ({
  driftHeartbeatRef,
  lastDriftHeartbeatAtRef,
}: Pick<StartTimerDriftDetectionParams, "driftHeartbeatRef" | "lastDriftHeartbeatAtRef">) => {
  if (driftHeartbeatRef.current) clearInterval(driftHeartbeatRef.current);
  driftHeartbeatRef.current = null;
  lastDriftHeartbeatAtRef.current = null;
};
