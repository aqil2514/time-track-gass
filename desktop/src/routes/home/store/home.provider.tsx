import { KeyedMutator } from "swr";
import { AIScreenReportDb } from "../types/ai-record.type";
import React, { createContext, useContext, useState } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { buildUrl } from "@/utils/build-url";
import {
  TimerStatus,
  useHomeTimerController,
} from "../logic/use-home-timer-controller";
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
  };

  controllerExcel: {
    isLoading: boolean;
    exportToExcel: (data: AIScreenReportDb[]) => Promise<void>;
  };
}

const HomeContext = createContext<HomeContextType>({} as HomeContextType);

export function HomeProvider({ children }: { children: React.ReactNode }) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const url = date
    ? buildUrl(`activities/v2?date=${startOfDay(date).toISOString()}`)
    : buildUrl(`activities/v2`);
  const fetcher = useFetch<HomeData>(url);

  const timerController = useHomeTimerController(fetcher.mutate);
  const excelController = useHomeExcelController();

  const values: HomeContextType = {
    fetcher: { ...fetcher, date, setDate },
    controllerTime: { ...timerController },
    controllerExcel: { ...excelController },
  };
  return <HomeContext.Provider value={values}>{children}</HomeContext.Provider>;
}

export const useHomeContext = () => useContext(HomeContext);
