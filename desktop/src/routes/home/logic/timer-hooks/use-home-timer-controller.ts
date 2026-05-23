import { TIME_TO_SCREENSHOT } from "@/constants/home";
import { useCapture } from "@/hooks/use-capture";
import { buildUrl } from "@/utils/build-url";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { useCallback, useEffect, useRef, useState } from "react";
import { KeyedMutator } from "swr";
import api from "@/lib/api";
import { load } from "@tauri-apps/plugin-store";
import { writeLogToDb } from "@/utils/write-log-to-db";
import { HomeData } from "../../types/activites-data.type";
import { message } from "@tauri-apps/plugin-dialog";
import { writeMacTimerLog } from "./macos-timer-log";
import { bringWindowToFront } from "./timer-window";
import {
  startTimerDriftDetection,
  stopTimerDriftDetection,
} from "./timer-drift";
import {
  startKeepAwake,
  startNativeTimer,
  stopKeepAwake,
  stopNativeTimer,
} from "./native-timer";

const MAX_RETRY = 3;
const RETRY_DELAY = 5;
const UPLOAD_TIMEOUT_MS = 60_000;

export type TimerStatus =
  | "idle"
  | "countdown"
  | "capturing"
  | "uploading"
  | "error";

type CaptureResult = "success" | "cooldown" | "error";

export function useHomeTimerController(mutate: KeyedMutator<HomeData>) {
  const { capture } = useCapture();

  const [status, setStatus] = useState<TimerStatus>("idle");
  const [countdown, setCountdown] = useState(TIME_TO_SCREENSHOT);
  const [isRunning, setIsRunningState] = useState(false);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nativeTimerUnlistenRef = useRef<UnlistenFn | null>(null);
  const nextCaptureAtRef = useRef<number | null>(null);
  const driftHeartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastDriftHeartbeatAtRef = useRef<number | null>(null);
  const isCapturingRef = useRef(false);
  const isRunningRef = useRef(false);
  const isStoppedRef = useRef(false);
  const statusRef = useRef<TimerStatus>("idle");

  const setTimerStatus = useCallback((value: TimerStatus) => {
    statusRef.current = value;
    setStatus(value);
  }, []);

  const setIsRunning = useCallback((value: boolean) => {
    isRunningRef.current = value;
    setIsRunningState(value);
  }, []);

  const startTimerKeepAwake = useCallback(async () => {
    try {
      await startKeepAwake();
      await writeMacTimerLog("mac_timer_keep_awake_start_success");
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
      await writeMacTimerLog("mac_timer_keep_awake_stop_success");
    } catch (error) {
      await writeMacTimerLog(
        "mac_timer_keep_awake_stop_failed",
        { errorMessage: error instanceof Error ? error.message : String(error) },
        "ERROR",
      );
    }
  }, []);

  const startTimerNativeTrigger = useCallback(
    async (onTick: () => void | Promise<void>) => {
      try {
        nativeTimerUnlistenRef.current?.();
        nativeTimerUnlistenRef.current = await listen("native_timer_tick", () => {
          void onTick();
        });
        await startNativeTimer(1);
        await writeMacTimerLog("mac_timer_native_timer_start_success");
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
      await writeMacTimerLog("mac_timer_native_timer_stop_success");
    } catch (error) {
      await writeMacTimerLog(
        "mac_timer_native_timer_stop_failed",
        { errorMessage: error instanceof Error ? error.message : String(error) },
        "ERROR",
      );
    }
  }, []);

  // ==============================
  // CLEAR ALL TIMERS
  // ==============================
  const clearTimers = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    stopTimerDriftDetection({ driftHeartbeatRef, lastDriftHeartbeatAtRef });

    countdownRef.current = null;
    nextCaptureAtRef.current = null;
  };

  const stopAllNativeTimerSideEffects = useCallback(async () => {
    await stopTimerNativeTrigger();
    await stopTimerKeepAwake();
  }, [stopTimerKeepAwake, stopTimerNativeTrigger]);

  // ==============================
  // COUNTDOWN ENGINE
  // ==============================
  const startCountdown = useCallback(
    (onComplete?: () => void) => {
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
    },
    [],
  );

  // ==============================
  // CAPTURE PROCESS
  // ==============================
  const captureHandler = useCallback(async (): Promise<CaptureResult> => {
    if (isCapturingRef.current) return "error";
    isCapturingRef.current = true;

    const captureCycleId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    let attempts = 0;

    await writeMacTimerLog("mac_timer_capture_cycle_start", {
      captureCycleId,
      status: statusRef.current,
    });

    try {
      while (attempts < MAX_RETRY) {
        try {
          setTimerStatus("capturing");
          await writeMacTimerLog("mac_timer_capture_attempt_start", {
            captureCycleId,
            attempt: attempts + 1,
          });

          const dataUrl = await capture();
          if (!dataUrl) throw new Error("Capture failed: No data received");

          if (isStoppedRef.current) return "error";

          setTimerStatus("uploading");
          const uploadStartedAt = Date.now();
          await writeMacTimerLog("mac_timer_upload_start", {
            captureCycleId,
            imageLength: dataUrl.length,
            timeoutMs: UPLOAD_TIMEOUT_MS,
          });

          const store = await load("auth.json");
          const token = await store.get<string>("accessToken");
          if (!token) throw new Error("Upload failed: Access token not found");

          const res = await api.post(
            buildUrl("image-upload"),
            { image: dataUrl },
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: UPLOAD_TIMEOUT_MS,
            },
          );

          if (res.status === 409 && res.data?.code === "NO_ACTIVE_WORK_SESSION") {
            await writeMacTimerLog(
              "mac_timer_upload_no_active_session",
              { captureCycleId, status: res.status, data: res.data },
              "WARN",
            );
            await bringWindowToFront();
            clearTimers();
            await stopAllNativeTimerSideEffects();
            setIsRunning(false);
            setTimerStatus("idle");
            await message(
              "Sesi kerja belum dimulai atau sudah berakhir. Silakan klik Start Session terlebih dahulu.",
              { title: "Session Belum Aktif", kind: "warning" },
            );
            return "error";
          }

          if (res.status === 422) {
            const retryAfterSeconds =
              typeof res.data?.retryAfterSeconds === "number"
                ? res.data.retryAfterSeconds
                : undefined;

            if (retryAfterSeconds && retryAfterSeconds > 0) {
              await writeLogToDb({
                context: "captureHandler:Throttled",
                level: "WARN",
                message: "Auto upload cooldown reached",
                metadata: { status: res.status, data: res.data },
              });
              await writeMacTimerLog(
                "mac_timer_upload_cooldown",
                { captureCycleId, status: res.status, retryAfterSeconds },
                "WARN",
              );

              const retryTarget = Date.now() + retryAfterSeconds * 1000;
              nextCaptureAtRef.current = retryTarget;
              setCountdown(retryAfterSeconds);
              setTimerStatus("countdown");
              startCountdown();
              return "cooldown";
            }

            await writeLogToDb({
              context: "captureHandler:Throttled",
              level: "WARN",
              message: "Auto upload cooldown reached",
              metadata: { status: res.status, data: res.data },
            });
            await writeMacTimerLog(
              "mac_timer_upload_cooldown_without_retry",
              { captureCycleId, status: res.status },
              "WARN",
            );
            setTimerStatus("error");
            return "error";
          }

          if (res.status < 200 || res.status >= 300) {
            throw new Error(`Upload failed: ${res.status}`);
          }

          await writeMacTimerLog("mac_timer_upload_success", {
            captureCycleId,
            status: res.status,
            uploadDurationMs: Date.now() - uploadStartedAt,
          });
          await mutate();
          setTimerStatus("countdown");
          await writeMacTimerLog("mac_timer_capture_cycle_success", {
            captureCycleId,
          });
          return "success";
        } catch (error) {
          attempts++;

          const isUploadTimeout =
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "ECONNABORTED";

          await writeLogToDb({
            context: "captureHandler",
            level: "ERROR",
            message: error instanceof Error ? error.message : "Capture error",
            metadata: {
              error,
              stack: error instanceof Error ? error.stack : undefined,
              retryCount: attempts,
              isUploadTimeout,
            },
          });
          await writeMacTimerLog(
            "mac_timer_capture_attempt_failed",
            {
              captureCycleId,
              retryCount: attempts,
              errorMessage: error instanceof Error ? error.message : String(error),
              isUploadTimeout,
            },
            "ERROR",
          );

          if (attempts >= MAX_RETRY || isStoppedRef.current) break;

          // ⏳ delay sebelum retry
          setTimerStatus("countdown");
          const retryTarget = Date.now() + RETRY_DELAY * 1000;
          nextCaptureAtRef.current = retryTarget;
          setCountdown(RETRY_DELAY);
          await writeMacTimerLog("mac_timer_retry_scheduled", {
            captureCycleId,
            retryCount: attempts,
            retryDelaySeconds: RETRY_DELAY,
            retryTarget,
          });
          await new Promise<void>((resolve) => {
            const startedAt = Date.now();
            const waitForRetryTarget = setInterval(() => {
              const remaining = Math.max(
                0,
                Math.round((retryTarget - Date.now()) / 1000),
              );
              setCountdown(remaining);

              if (Date.now() >= retryTarget || Date.now() - startedAt >= RETRY_DELAY * 1000) {
                clearInterval(waitForRetryTarget);
                resolve();
              }
            }, 500);
          });

          if (isStoppedRef.current) return "error";
        }
      }

      await writeMacTimerLog(
        "mac_timer_capture_cycle_failed_final",
        { captureCycleId, retryCount: attempts, isStopped: isStoppedRef.current },
        "ERROR",
      );
      await bringWindowToFront();
      setTimerStatus("error");
      await stopAllNativeTimerSideEffects();
      await message(
        "Capture/upload gagal 3 kali berturut-turut. Coba hard-restart (CTRL + F5) aplikasi lalu jalankan session lagi.",
        { title: "Capture Failed", kind: "error" },
      );
      return "error";
    } finally {
      isCapturingRef.current = false;
    }
  }, [capture, mutate, startCountdown, stopAllNativeTimerSideEffects]);

  // ==============================
  // MAIN LOOP (NATIVE TIMER TRIGGER)
  // ==============================
  const scheduleNextCapture = useCallback(() => {
    const nextTarget = Date.now() + TIME_TO_SCREENSHOT * 1000;
    nextCaptureAtRef.current = nextTarget;
    setCountdown(TIME_TO_SCREENSHOT);
    setTimerStatus("countdown");

    void writeMacTimerLog("mac_timer_schedule_next_capture", {
      nextTarget,
      delaySeconds: TIME_TO_SCREENSHOT,
      trigger: "native_timer",
    });
    startCountdown();
  }, [startCountdown, setTimerStatus]);

  const handleNativeTimerTick = useCallback(async () => {
    if (isStoppedRef.current || !isRunningRef.current || isCapturingRef.current) return;

    const nextTarget = nextCaptureAtRef.current;
    if (!nextTarget || Date.now() < nextTarget) return;

    nextCaptureAtRef.current = null;
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = null;
    setCountdown(0);

    await writeMacTimerLog("mac_timer_capture_triggered", {
      scheduledTarget: nextTarget,
      driftMs: Date.now() - nextTarget,
      trigger: "native_timer",
    });

    const result = await captureHandler();
    await writeMacTimerLog("mac_timer_capture_result", {
      result,
      trigger: "native_timer",
    });

    if (!isStoppedRef.current && result === "success") {
      scheduleNextCapture();
    } else if (!isStoppedRef.current && result === "error") {
      void writeMacTimerLog(
        "mac_timer_stopped_by_error",
        { result, trigger: "native_timer" },
        "ERROR",
      );
      void stopAllNativeTimerSideEffects();
      setIsRunning(false);
    }
  }, [
    captureHandler,
    scheduleNextCapture,
    setIsRunning,
    stopAllNativeTimerSideEffects,
  ]);

  // ==============================
  // START
  // ==============================
  const startAutoCapture = useCallback(async () => {
    if (isRunningRef.current) {
      void writeMacTimerLog("mac_timer_start_skipped", {
        reason: "already_running",
        status: statusRef.current,
      });
      return;
    }
    setIsRunning(true);
    isStoppedRef.current = false;
    await startTimerKeepAwake();
    await startTimerNativeTrigger(handleNativeTimerTick);
    startTimerDriftDetection({
      driftHeartbeatRef,
      lastDriftHeartbeatAtRef,
      nextCaptureAtRef,
      getStatus: () => statusRef.current,
    });
    await writeMacTimerLog("mac_timer_start", { status: statusRef.current });

    const result = await captureHandler();

    await writeMacTimerLog("mac_timer_initial_capture_result", { result });

    if (!isStoppedRef.current && result === "success") {
      scheduleNextCapture();
    } else if (!isStoppedRef.current && result === "error") {
      await writeMacTimerLog(
        "mac_timer_stopped_by_initial_capture_error",
        { result },
        "ERROR",
      );
      await stopAllNativeTimerSideEffects();
      setIsRunning(false);
    }
  }, [
    captureHandler,
    handleNativeTimerTick,
    scheduleNextCapture,
    setIsRunning,
    startTimerKeepAwake,
    startTimerNativeTrigger,
    stopAllNativeTimerSideEffects,
  ]);

  // ==============================
  // STOP
  // ==============================
  const stopAutoCapture = useCallback(() => {
    void writeMacTimerLog("mac_timer_stop", { status: statusRef.current });
    isStoppedRef.current = true;
    setIsRunning(false);
    clearTimers();
    void stopAllNativeTimerSideEffects();
    setCountdown(TIME_TO_SCREENSHOT);
    setTimerStatus("idle");
  }, [setIsRunning, setTimerStatus, stopAllNativeTimerSideEffects]);

  // ==============================
  // CLEANUP ON UNMOUNT
  // ==============================
  useEffect(() => {
    return () => {
      clearTimers();
      void stopAllNativeTimerSideEffects();
    };
  }, [stopAllNativeTimerSideEffects]);

  return {
    startAutoCapture,
    stopAutoCapture,
    status,
    countdown,
    isRunning,
  };
}
