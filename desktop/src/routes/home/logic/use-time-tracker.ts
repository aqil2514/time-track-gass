import { useCapture } from "@/hooks/use-capture";
import { buildUrl } from "@/utils/build-url";
import { secondsToTimeString } from "@/utils/time-to-seconds";
import { readFile, writeFile } from "@tauri-apps/plugin-fs";
import axios from "axios";
import { useCallback, useRef, useState } from "react";
import { AIScreenReportDb } from "../types/ai-record.type";
import { KeyedMutator } from "swr";
import * as XLSX from "xlsx";
import { desktopDir } from "@tauri-apps/api/path";
import { formatDate } from "../components/columnsDef";

const DEFAULT_INTERVAL_SECONDS = 600; // 10 menit

export function useTimeTracker(mutate: KeyedMutator<AIScreenReportDb[]>) {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isLoadingManual, setIsLoadingManual] = useState<boolean>(false);
  const [isLoadingExport, setIsLoadingExport] = useState<boolean>(false);
  const [intervalSeconds, setIntervalSeconds] = useState<number>(
    DEFAULT_INTERVAL_SECONDS,
  );
  const [countdown, setCountdown] = useState<number>(DEFAULT_INTERVAL_SECONDS);
  const { capture } = useCapture();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const nextCaptureAtRef = useRef<number | null>(null); // timestamp target capture berikutnya

  const isCapturingRef = useRef(false);

  const captureHandler = useCallback(async () => {
    if (isCapturingRef.current) return;

    try {
      isCapturingRef.current = true;
      setIsLoadingManual(true);
      const capturePath = await capture();
      if (!capturePath) return;

      const fileData = await readFile(capturePath);
      const blob = new Blob([fileData]);

      const formData = new FormData();
      formData.append("file", blob);
      const url = buildUrl("image-upload");

      await axios.postForm(url, formData);

      mutate();
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setIsLoadingManual(false);
      isCapturingRef.current = false; // ← reset setelah selesai
    }
  }, [capture]);

  // Update countdown berdasarkan timestamp target — satu sumber kebenaran
  const startCountdownTick = useCallback((targetTimestamp: number) => {
    if (countdownRef.current) clearInterval(countdownRef.current);

    countdownRef.current = setInterval(() => {
      const remaining = Math.round((targetTimestamp - Date.now()) / 1000);
      setCountdown(remaining > 0 ? remaining : 0);
    }, 500); // tick lebih cepat agar akurat
  }, []);

  // Fungsi start auto capture
  const startAutoCapture = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);

    // capture pertama langsung
    captureHandler();

    // set target capture berikutnya
    const firstTarget = Date.now() + intervalSeconds * 1000;
    nextCaptureAtRef.current = firstTarget;
    setCountdown(intervalSeconds);
    startCountdownTick(firstTarget);

    intervalRef.current = setInterval(() => {
      captureHandler();

      // update target untuk capture berikutnya
      const nextTarget = Date.now() + intervalSeconds * 1000;
      nextCaptureAtRef.current = nextTarget;
      startCountdownTick(nextTarget);
    }, intervalSeconds * 1000);
  }, [isRunning, intervalSeconds, captureHandler, startCountdownTick]);

  // Fungsi stop auto capture
  const stopAutoCapture = useCallback(() => {
    setIsRunning(false);
    setCountdown(intervalSeconds);
    nextCaptureAtRef.current = null;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, [intervalSeconds]);

  // Convert input time HH:MM:SS ke detik
  const handleTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const parts = e.target.value.split(":").map(Number);

      let totalSeconds = DEFAULT_INTERVAL_SECONDS; // default ke 10 menit
      if (parts.length === 2) {
        const [hours, minutes] = parts;
        totalSeconds = hours * 3600 + minutes * 60;
      } else if (parts.length === 3) {
        const [hours, minutes, seconds] = parts;
        totalSeconds = hours * 3600 + minutes * 60 + seconds;
      }

      const validated =
        totalSeconds > 0 ? totalSeconds : DEFAULT_INTERVAL_SECONDS;
      setIntervalSeconds(validated);

      // Hanya update countdown tampilan kalau sedang tidak running
      if (!isRunning) {
        setCountdown(validated);
      }
    },
    [isRunning],
  );

  const intervalSecondText = secondsToTimeString(countdown);

const exportToExcel = useCallback(async (data: AIScreenReportDb[]) => {
  try {
    setIsLoadingExport(true);

    const mappedData = data.map(({ id, created_at, ...rest }) => ({
      created_at: formatDate(created_at),
      ...rest,
    }));

    const worksheet = XLSX.utils.json_to_sheet(mappedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

    const buffer: Uint8Array = XLSX.write(workbook, {
      type: "array",  // ← fix dari "buffer"
      bookType: "xlsx",
    });

    const desktop = await desktopDir();
    const filePath = `${desktop}/ai-screen-report.xlsx`;

    await writeFile(filePath, buffer);
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    setIsLoadingExport(false);
  }
}, []);

  return {
    isLoadingManual,
    startAutoCapture,
    stopAutoCapture,
    handleTimeChange,
    intervalSecondText,
    isRunning,
    captureHandler,
    exportToExcel,
    isLoadingExport,
  };
}
