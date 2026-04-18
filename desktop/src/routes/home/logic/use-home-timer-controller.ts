import { TIME_TO_SCREENSHOT } from "@/constants/home";
import { useCapture } from "@/hooks/use-capture";
import { buildUrl } from "@/utils/build-url";
import { useCallback, useEffect, useRef, useState } from "react";
import { KeyedMutator } from "swr";
import { ActivityData } from "../types/activites-data.type";
import api from "@/lib/api";
import { load } from "@tauri-apps/plugin-store";

export type TimerStatus =
  | "idle"
  | "countdown"
  | "capturing"
  | "uploading"
  | "error";

export function useHomeTimerController(mutate: KeyedMutator<ActivityData[]>) {
  const { capture } = useCapture();

  const [status, setStatus] = useState<TimerStatus>("idle");
  const [countdown, setCountdown] = useState(TIME_TO_SCREENSHOT);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextCaptureAtRef = useRef<number | null>(null);
  const isCapturingRef = useRef(false);

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
      // const isSameImage = await compareImage(dataUrl);
      // if (isSameImage) {
      //   setStatus("countdown")
      //   return;
      // }

      if (!dataUrl) throw new Error("Capture failed");

      setStatus("uploading");

      const store = await load("auth.json");
      const token = await store.get<string>("accessToken");

      await api.post(
        buildUrl("image-upload"),
        { image: dataUrl },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      await mutate();
    } catch (error) {
      console.error(error);
      setStatus("error");
      return;
    } finally {
      isCapturingRef.current = false;
    }

    setStatus("countdown");
  }, [capture, mutate]);

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
    if (status !== "idle") return;

    await captureHandler(); // capture pertama langsung
    scheduleNextCapture();
  }, [captureHandler, scheduleNextCapture, status]);

  // ==============================
  // STOP
  // ==============================
  const stopAutoCapture = useCallback(() => {
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
