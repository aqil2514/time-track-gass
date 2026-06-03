import { KeyedMutator } from "swr";
import { AIScreenReportDb } from "../types/ai-record.type";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFetch } from "@/hooks/use-fetch";
import { buildUrl } from "@/utils/build-url";
import {
  TimerStatus,
  useHomeTimerController,
} from "../logic/timer-hooks/use-home-timer-controller";
import { useHomeExcelController } from "../logic/use-home-excel-controller";
import { HomeData } from "../types/activites-data.type";
import { startOfDay } from "date-fns";

interface HomeContextType {
  fetcher: {
    date: Date | undefined;
    setDate: React.Dispatch<React.SetStateAction<Date | undefined>>;

    data: HomeData | undefined;
    error: any;
    isLoading: boolean;
    mutate: KeyedMutator<HomeData>;
  };

  controllerTime: {
    stopAutoCapture: () => void;
    startAutoCapture: () => void;
    isRunning: boolean;
    status: TimerStatus;
    countdown: number;
    didAutoResume: boolean;
  };

  controllerExcel: {
    isLoading: boolean;
    exportToExcel: (data: AIScreenReportDb[]) => Promise<void>;
  };
}

const HomeContext = createContext<HomeContextType>({} as HomeContextType);

export function HomeProvider({ children }: { children: React.ReactNode }) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [didAutoResume, setDidAutoResume] = useState(false);
  const hasAutoResumedRef = useRef(false);
  const autoResumeBadgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const url = date
    ? buildUrl(`activities/v2?date=${startOfDay(date).toISOString()}`)
    : buildUrl(`activities/v2`);
  const fetcher = useFetch<HomeData>(url);

  const timerController = useHomeTimerController(fetcher.mutate);
  const excelController = useHomeExcelController();

  useEffect(() => {
    if (hasAutoResumedRef.current) return;
    if (fetcher.isLoading) return;
    if (!fetcher.data?.workSessions?.length) return;
    if (timerController.isRunning) return;

    const hasActiveSession = fetcher.data.workSessions.some(
      (session) => session.end_at === null,
    );

    if (!hasActiveSession) return;

    hasAutoResumedRef.current = true;
    setDidAutoResume(true);

    if (autoResumeBadgeTimerRef.current) {
      clearTimeout(autoResumeBadgeTimerRef.current);
    }

    autoResumeBadgeTimerRef.current = setTimeout(() => {
      setDidAutoResume(false);
      autoResumeBadgeTimerRef.current = null;
    }, 5000);

    void timerController.startAutoCapture();
  }, [fetcher.data, fetcher.isLoading, timerController]);

  useEffect(() => {
    return () => {
      if (autoResumeBadgeTimerRef.current) {
        clearTimeout(autoResumeBadgeTimerRef.current);
      }
    };
  }, []);

  const values: HomeContextType = {
    fetcher: { ...fetcher, date, setDate },
    controllerTime: { ...timerController, didAutoResume },
    controllerExcel: { ...excelController },
  };
  return <HomeContext.Provider value={values}>{children}</HomeContext.Provider>;
}

export const useHomeContext = () => useContext(HomeContext);
