import { TIME_TO_SCREENSHOT } from "@/constants/home";
import { useCapture } from "@/hooks/use-capture";
import { buildUrl } from "@/utils/build-url";
import { useCallback, useEffect, useRef, useState } from "react";
import { KeyedMutator } from "swr";
import api from "@/lib/api";
import { load } from "@tauri-apps/plugin-store";
import { writeLogToDb } from "@/utils/write-log-to-db";
import { HomeData } from "../types/activites-data.type";

export type TimerStatus =
  | "idle"
  | "countdown"
  | "capturing"
  | "uploading"
  | "error";

export function useHomeTimerController(mutate: KeyedMutator<HomeData>) {
  const { capture } = useCapture();

  const [status, setStatus] = useState<TimerStatus>("idle");
  const [countdown, setCountdown] = useState(TIME_TO_SCREENSHOT);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextCaptureAtRef = useRef<number | null>(null);
  const isCapturingRef = useRef(false);
  const retryCountRef = useRef(0);
  const isStoppedRef = useRef(false);

  const MAX_RETRY = 3;
  const RETRY_DELAY = 5; //detik

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
  const startCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);

    countdownRef.current = setInterval(() => {
      if (!nextCaptureAtRef.current) return;

      const remaining = Math.max(
        0,
        Math.round((nextCaptureAtRef.current - Date.now()) / 1000),
      );

      setCountdown(remaining);
    }, 500);
  }, []);

  // ==============================
  // CAPTURE PROCESS
  // ==============================
  const captureHandler = useCallback(async () => {
    if (isCapturingRef.current) return;

    try {
      isCapturingRef.current = true;
      setStatus("capturing");

      const dataUrl = await capture();
      if (!dataUrl) throw new Error("Capture failed: No data received");

      if (isStoppedRef.current) return;

      setStatus("uploading");

      const store = await load("auth.json");
      const token = await store.get<string>("accessToken");
      if (!token) throw new Error("Upload failed: Access token not found");

      const res = await api.post(
        buildUrl("image-upload"),
        { image: dataUrl },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.status === 429) {
        await writeLogToDb({
          context: "captureHandler:Throttled",
          level: "WARN",
          message: "Rate limit reached (429)",
          metadata: { status: res.status, data: res.data },
        });
        setStatus("error");
        return;
      }

      // ✅ Sukses — reset retry counter
      retryCountRef.current = 0;
      await mutate();
    } catch (error) {
      retryCountRef.current += 1;

      await writeLogToDb({
        context: "captureHandler",
        level: "ERROR",
        message: error instanceof Error ? error.message : "Capture error",
        metadata: {
          error,
          stack: error instanceof Error ? error.stack : undefined,
          retryCount: retryCountRef.current,
        },
      });

      if (retryCountRef.current < MAX_RETRY) {
        if (isStoppedRef.current) return;
        // 🔄 Auto retry setelah RETRY_DELAY detik
        setStatus("countdown");

        const retryTarget = Date.now() + RETRY_DELAY * 1000;
        nextCaptureAtRef.current = retryTarget;
        setCountdown(RETRY_DELAY);
        startCountdown();

        timerRef.current = setTimeout(async () => {
          await captureHandler();
        }, RETRY_DELAY * 1000);
      } else {
        // ❌ Sudah MAX_RETRY kali gagal — stop
        retryCountRef.current = 0;
        setStatus("error");
      }

      return;
    } finally {
      isCapturingRef.current = false;
    }

    setStatus("countdown");
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
      await captureHandler();
      scheduleNextCapture(); // recursive, stabil
    }, TIME_TO_SCREENSHOT * 1000);
  }, [captureHandler, startCountdown]);

  // ==============================
  // START
  // ==============================
  const startAutoCapture = useCallback(async () => {
    isStoppedRef.current = false;
    if (status !== "idle") return;

    await captureHandler(); // capture pertama langsung
    scheduleNextCapture();
  }, [captureHandler, scheduleNextCapture, status]);

  // ==============================
  // STOP
  // ==============================
  const stopAutoCapture = useCallback(() => {
    isStoppedRef.current = true;
    clearTimers();
    setCountdown(TIME_TO_SCREENSHOT);
    setStatus("idle");
  }, []);

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
    isRunning: status !== "idle",
  };
}
