import { KeyedMutator } from "swr";
import { AIScreenReportDb } from "../types/ai-record.type";
import React, { createContext, useContext } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { buildUrl } from "@/utils/build-url";
import {
  TimerStatus,
  useHomeTimerController,
} from "../logic/use-home-timer-controller";
import { useHomeExcelController } from "../logic/use-home-excel-controller";
import { ActivityData } from "../types/activites-data.type";

interface HomeContextType {
  fetcher: {
    data: ActivityData[] | undefined;
    error: any;
    isLoading: boolean;
    mutate: KeyedMutator<ActivityData[]>;
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
    exportToExcel: (data: AIScreenReportDb[]) => Promise<void>
  };
}

const HomeContext = createContext<HomeContextType>({} as HomeContextType);

export function HomeProvider({ children }: { children: React.ReactNode }) {
  const url = buildUrl("activities/user");
  const fetcher = useFetch<ActivityData[]>(url);
  const timerController = useHomeTimerController(fetcher.mutate);
  const excelController = useHomeExcelController();

  const values: HomeContextType = {
    fetcher: { ...fetcher },
    controllerTime: { ...timerController },
    controllerExcel: { ...excelController },
  };
  return <HomeContext.Provider value={values}>{children}</HomeContext.Provider>;
}

export const useHomeContext = () => useContext(HomeContext);
