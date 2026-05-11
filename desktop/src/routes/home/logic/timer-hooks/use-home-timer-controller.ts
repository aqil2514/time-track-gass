import { TIME_TO_SCREENSHOT } from "@/constants/home";
import { useCapture } from "@/hooks/use-capture";
import { buildUrl } from "@/utils/build-url";
import { useCallback, useEffect, useRef, useState } from "react";
import { KeyedMutator } from "swr";
import api from "@/lib/api";
import { load } from "@tauri-apps/plugin-store";
import { writeLogToDb } from "@/utils/write-log-to-db";
import { HomeData } from "../../types/activites-data.type";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { message } from "@tauri-apps/plugin-dialog";

const MAX_RETRY = 3;

const bringWindowToFront = async () => {
  try {
    const window = getCurrentWindow();
    await window.show();
    await window.unminimize();
    await window.setFocus();
  } catch (error) {
    console.error("[captureHandler] failed to focus window", error);
  }
};

const RETRY_DELAY = 5;

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

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextCaptureAtRef = useRef<number | null>(null);
  const isCapturingRef = useRef(false);
  const isRunningRef = useRef(false);
  const isStoppedRef = useRef(false);

  const setIsRunning = useCallback((value: boolean) => {
    isRunningRef.current = value;
    setIsRunningState(value);
  }, []);

  // ==============================
  // CLEAR ALL TIMERS
  // ==============================
  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    timerRef.current = null;
    countdownRef.current = null;
    nextCaptureAtRef.current = null;
  };

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
          nextCaptureAtRef.current = null;
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

    let attempts = 0;

    try {
      while (attempts < MAX_RETRY) {
        try {
          setStatus("capturing");

          const dataUrl = await capture();
          if (!dataUrl) throw new Error("Capture failed: No data received");

          if (isStoppedRef.current) return "error";

          setStatus("uploading");

          const store = await load("auth.json");
          const token = await store.get<string>("accessToken");
          if (!token) throw new Error("Upload failed: Access token not found");

          const res = await api.post(
            buildUrl("image-upload"),
            { image: dataUrl },
            { headers: { Authorization: `Bearer ${token}` } },
          );

          console.log(res)

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

              const retryTarget = Date.now() + retryAfterSeconds * 1000;
              nextCaptureAtRef.current = retryTarget;
              setCountdown(retryAfterSeconds);
              setStatus("countdown");
              startCountdown(() => {
                if (!isStoppedRef.current) {
                  void captureHandler().then((result) => {
                    if (!isStoppedRef.current && result === "success") {
                      scheduleNextCapture();
                    } else if (!isStoppedRef.current && result === "error") {
                      setIsRunning(false);
                    }
                  });
                }
              });
              return "cooldown";
            }

            await writeLogToDb({
              context: "captureHandler:Throttled",
              level: "WARN",
              message: "Auto upload cooldown reached",
              metadata: { status: res.status, data: res.data },
            });
            setStatus("error");
            return "error";
          }

          if (res.status < 200 || res.status >= 300) {
            throw new Error(`Upload failed: ${res.status}`);
          }

          // ✅ sukses
          await mutate();
          setStatus("countdown");
          return "success";
        } catch (error) {
          attempts++;

          await writeLogToDb({
            context: "captureHandler",
            level: "ERROR",
            message: error instanceof Error ? error.message : "Capture error",
            metadata: {
              error,
              stack: error instanceof Error ? error.stack : undefined,
              retryCount: attempts,
            },
          });

          if (attempts >= MAX_RETRY || isStoppedRef.current) break;

          // ⏳ delay sebelum retry
          setStatus("countdown");
          const retryTarget = Date.now() + RETRY_DELAY * 1000;
          nextCaptureAtRef.current = retryTarget;
          setCountdown(RETRY_DELAY);
          startCountdown();

          await new Promise<void>((resolve) => {
            timerRef.current = setTimeout(resolve, RETRY_DELAY * 1000);
          });

          if (isStoppedRef.current) return "error";
        }
      }

      // ❌ habis semua retry
      await bringWindowToFront();
      setStatus("error");
      await message(
        "Capture/upload gagal 3 kali berturut-turut. Coba hard-restart (CTRL + F5) aplikasi lalu jalankan session lagi.",
        { title: "Capture Failed", kind: "error" },
      );
      return "error";
    } finally {
      isCapturingRef.current = false;
    }
  }, [capture, mutate, startCountdown]);

  // ==============================
  // MAIN LOOP (ANTI DRIFT)
  // ==============================
  const scheduleNextCapture = useCallback(() => {
    const nextTarget = Date.now() + TIME_TO_SCREENSHOT * 1000;
    nextCaptureAtRef.current = nextTarget;
    setCountdown(TIME_TO_SCREENSHOT);
    setStatus("countdown");

    startCountdown();

    timerRef.current = setTimeout(async () => {
      if (isStoppedRef.current) return;

      const result = await captureHandler();

      if (!isStoppedRef.current && result === "success") {
        scheduleNextCapture();
      } else if (!isStoppedRef.current && result === "error") {
        // ✅ loop berhenti karena error, bukan karena stop
        setIsRunning(false);
      }
    }, TIME_TO_SCREENSHOT * 1000);
  }, [captureHandler, startCountdown, setIsRunning]);

  // ==============================
  // START
  // ==============================
  const startAutoCapture = useCallback(async () => {
    if (isRunningRef.current) return;
    setIsRunning(true);
    isStoppedRef.current = false;

    const result = await captureHandler();

    if (!isStoppedRef.current && result === "success") {
      scheduleNextCapture();
    } else if (!isStoppedRef.current && result === "error") {
      setIsRunning(false);
    }
  }, [captureHandler, scheduleNextCapture, setIsRunning]);

  // ==============================
  // STOP
  // ==============================
  const stopAutoCapture = useCallback(() => {
    isStoppedRef.current = true;
    setIsRunning(false);
    clearTimers();
    setCountdown(TIME_TO_SCREENSHOT);
    setStatus("idle");
  }, [setIsRunning]);

  // ==============================
  // CLEANUP ON UNMOUNT
  // ==============================
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  return {
    startAutoCapture,
    stopAutoCapture,
    status,
    countdown,
    isRunning,
  };
}
