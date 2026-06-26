import { TIME_TO_SCREENSHOT } from "@/constants/home";
import { useCapture } from "@/hooks/use-capture";
import { UnlistenFn } from "@tauri-apps/api/event";
import { useCallback, useEffect, useRef, useState } from "react";
import { KeyedMutator } from "swr";
import { HomeData } from "../../types/activites-data.type";
import { writeMacTimerLog } from "./macos-timer-log";
import { startTimerDriftDetection } from "./timer-drift";
import { TimerStatus } from "./timer-types";
import { useKeepAwake } from "./use-keep-awake";
import { useNativeTimerTrigger } from "./use-native-timer-trigger";
import { useCountdown } from "./use-countdown";
import { useCaptureHandler } from "./use-capture-handler";

export type { TimerStatus } from "./timer-types";

export function useHomeTimerController(mutate: KeyedMutator<HomeData>) {
  const { capture } = useCapture();

  // ── React state ───────────────────────────────────────────────────────────
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [isRunning, setIsRunningState] = useState(false);

  // ── Refs (semua di sini agar child hooks berbagi objek yang sama) ──────────
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nativeTimerUnlistenRef = useRef<UnlistenFn | null>(null);
  const nextCaptureAtRef = useRef<number | null>(null);
  const driftHeartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastDriftHeartbeatAtRef = useRef<number | null>(null);
  const isCapturingRef = useRef(false);
  const isRunningRef = useRef(false);
  const isStoppedRef = useRef(false);
  const statusRef = useRef<TimerStatus>("idle");

  // ── Synced setters ────────────────────────────────────────────────────────
  const setTimerStatus = useCallback((value: TimerStatus) => {
    statusRef.current = value;
    setStatus(value);
  }, []);

  const setIsRunning = useCallback((value: boolean) => {
    isRunningRef.current = value;
    setIsRunningState(value);
  }, []);

  // ── Child hooks ───────────────────────────────────────────────────────────
  const { startTimerKeepAwake, stopTimerKeepAwake } = useKeepAwake();

  const { startTimerNativeTrigger, stopTimerNativeTrigger } =
    useNativeTimerTrigger({ nativeTimerUnlistenRef });

  const { countdown, setCountdown, startCountdown, clearTimers } = useCountdown({
    countdownRef,
    nextCaptureAtRef,
    driftHeartbeatRef,
    lastDriftHeartbeatAtRef,
  });

  const stopAllNativeTimerSideEffects = useCallback(async () => {
    await stopTimerNativeTrigger();
    await stopTimerKeepAwake();
  }, [stopTimerKeepAwake, stopTimerNativeTrigger]);

  const { captureHandler } = useCaptureHandler({
    refs: { isCapturingRef, isStoppedRef, nextCaptureAtRef, statusRef },
    capture,
    mutate,
    setCountdown,
    setTimerStatus,
    setIsRunning,
    startCountdown,
    clearTimers,
    stopAllNativeTimerSideEffects,
  });

  // ── Main loop ─────────────────────────────────────────────────────────────
  const scheduleNextCapture = useCallback(() => {
    const nextTarget = Date.now() + TIME_TO_SCREENSHOT * 1000;
    nextCaptureAtRef.current = nextTarget;
    setCountdown(TIME_TO_SCREENSHOT);
    setTimerStatus("countdown");
    startCountdown();
  }, [startCountdown, setTimerStatus, setCountdown]);

  const handleNativeTimerTick = useCallback(async () => {
    if (isStoppedRef.current || !isRunningRef.current || isCapturingRef.current) return;

    const nextTarget = nextCaptureAtRef.current;
    if (!nextTarget || Date.now() < nextTarget) return;

    nextCaptureAtRef.current = null;
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = null;
    setCountdown(0);

    const result = await captureHandler();

    if (!isStoppedRef.current && (result === "success" || result === "cooldown")) {
      scheduleNextCapture();
    } else if (!isStoppedRef.current && result === "error") {
      isStoppedRef.current = true;
      void writeMacTimerLog("mac_timer_stopped_by_error", { result }, "ERROR");
      await stopAllNativeTimerSideEffects();
      setIsRunning(false);
    }
  }, [captureHandler, scheduleNextCapture, setIsRunning, setCountdown, stopAllNativeTimerSideEffects]);

  // ── Start ─────────────────────────────────────────────────────────────────
  const startAutoCapture = useCallback(async () => {
    if (isRunningRef.current) return;

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

    const result = await captureHandler();

    if (!isStoppedRef.current && (result === "success" || result === "cooldown")) {
      scheduleNextCapture();
    } else if (!isStoppedRef.current && result === "error") {
      isStoppedRef.current = true;
      void writeMacTimerLog("mac_timer_stopped_by_initial_capture_error", { result }, "ERROR");
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

  // ── Stop ──────────────────────────────────────────────────────────────────
  const stopAutoCapture = useCallback(async () => {
    isStoppedRef.current = true;
    setIsRunning(false);
    clearTimers();
    await stopAllNativeTimerSideEffects();
    setCountdown(TIME_TO_SCREENSHOT);
    setTimerStatus("idle");
  }, [setIsRunning, setTimerStatus, setCountdown, clearTimers, stopAllNativeTimerSideEffects]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearTimers();
      void stopAllNativeTimerSideEffects();
    };
  }, [clearTimers, stopAllNativeTimerSideEffects]);

  return { startAutoCapture, stopAutoCapture, status, countdown, isRunning };
}
