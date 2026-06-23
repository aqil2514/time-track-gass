import { RefObject, useCallback } from "react";
import { KeyedMutator } from "swr";
import { message } from "@tauri-apps/plugin-dialog";
import { load } from "@tauri-apps/plugin-store";
import api from "@/lib/api";
import { buildUrl } from "@/utils/build-url";
import { writeLogToDb } from "@/utils/write-log-to-db";
import { HomeData } from "../../types/activites-data.type";
import { writeMacTimerLog } from "./macos-timer-log";
import { bringWindowToFront } from "./timer-window";
import { CaptureResult, TimerStatus } from "./timer-types";

const MAX_RETRY = 3;
const RETRY_DELAY = 5;
const UPLOAD_TIMEOUT_MS = 15_000;
const CYCLE_TIMEOUT_MS = 30_000;

function withCycleTimeout<T>(promise: Promise<T>): Promise<T | "timeout"> {
  return Promise.race([
    promise,
    new Promise<"timeout">((resolve) =>
      setTimeout(() => resolve("timeout"), CYCLE_TIMEOUT_MS),
    ),
  ]);
}

export interface CaptureHandlerRefs {
  isCapturingRef: RefObject<boolean>;
  isStoppedRef: RefObject<boolean>;
  nextCaptureAtRef: RefObject<number | null>;
  statusRef: RefObject<TimerStatus>;
}

export interface CaptureHandlerDeps {
  refs: CaptureHandlerRefs;
  capture: () => Promise<string>;
  mutate: KeyedMutator<HomeData>;
  setCountdown: (value: number) => void;
  setTimerStatus: (value: TimerStatus) => void;
  setIsRunning: (value: boolean) => void;
  startCountdown: (onComplete?: () => void) => void;
  clearTimers: () => void;
  stopAllNativeTimerSideEffects: () => Promise<void>;
}

export function useCaptureHandler({
  refs,
  capture,
  mutate,
  setCountdown,
  setTimerStatus,
  setIsRunning,
  startCountdown,
  clearTimers,
  stopAllNativeTimerSideEffects,
}: CaptureHandlerDeps) {
  const { isCapturingRef, isStoppedRef, nextCaptureAtRef } = refs;

  const captureHandler = useCallback(async (): Promise<CaptureResult> => {
    if (isCapturingRef.current) return "error";
    isCapturingRef.current = true;

    let attempts = 0;

    try {
      while (attempts < MAX_RETRY) {
        try {
          setTimerStatus("capturing");

          const dataUrl = await capture();
          if (!dataUrl) throw new Error("Capture failed: No data received");

          if (isStoppedRef.current) return "error";

          setTimerStatus("uploading");

          const uploadResult = await withCycleTimeout(
            (async () => {
              const store = await load("auth.json");
              const token = await store.get<string>("accessToken");
              if (!token) throw new Error("Upload failed: Access token not found");

              return api.post(
                buildUrl("image-upload"),
                { image: dataUrl },
                {
                  headers: { Authorization: `Bearer ${token}` },
                  timeout: UPLOAD_TIMEOUT_MS,
                },
              );
            })(),
          );

          if (uploadResult === "timeout") {
            await writeLogToDb({
              context: "captureHandler:CycleTimeout",
              level: "WARN",
              message: "Upload cycle timed out, resuming timer",
              metadata: { cycleTimeoutMs: CYCLE_TIMEOUT_MS },
            });
            await writeMacTimerLog(
              "mac_timer_upload_cycle_timeout",
              { cycleTimeoutMs: CYCLE_TIMEOUT_MS },
              "WARN",
            );
            await bringWindowToFront();
            await message(
              "Upload screenshot timeout. Screenshot ini tidak tersimpan, namun timer tetap berjalan.",
              { title: "Upload Timeout", kind: "warning" },
            );
            setTimerStatus("countdown");
            return "cooldown";
          }

          const res = uploadResult;

          if (res.status === 409 && res.data?.code === "NO_ACTIVE_WORK_SESSION") {
            isStoppedRef.current = true;
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
                { status: res.status, retryAfterSeconds },
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
              { status: res.status },
              "WARN",
            );
            setTimerStatus("error");
            return "error";
          }

          if (res.status < 200 || res.status >= 300) {
            throw new Error(`Upload failed: ${res.status}`);
          }

          await mutate();
          setTimerStatus("countdown");
          return "success";
        } catch (error) {
          attempts++;

          const isUploadTimeout =
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            (error as Record<string, unknown>).code === "ECONNABORTED";

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
              retryCount: attempts,
              errorMessage: error instanceof Error ? error.message : String(error),
              isUploadTimeout,
            },
            "ERROR",
          );

          if (attempts >= MAX_RETRY || isStoppedRef.current) break;

          setTimerStatus("countdown");
          const retryTarget = Date.now() + RETRY_DELAY * 1000;
          nextCaptureAtRef.current = retryTarget;
          setCountdown(RETRY_DELAY);

          await new Promise<void>((resolve) => {
            const startedAt = Date.now();
            const waitForRetryTarget = setInterval(() => {
              const remaining = Math.max(
                0,
                Math.round((retryTarget - Date.now()) / 1000),
              );
              setCountdown(remaining);

              if (
                Date.now() >= retryTarget ||
                Date.now() - startedAt >= RETRY_DELAY * 1000
              ) {
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
        { retryCount: attempts },
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
  }, [
    capture,
    mutate,
    setCountdown,
    setTimerStatus,
    setIsRunning,
    startCountdown,
    clearTimers,
    stopAllNativeTimerSideEffects,
  ]);

  return { captureHandler };
}
