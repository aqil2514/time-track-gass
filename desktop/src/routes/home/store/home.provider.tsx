import { KeyedMutator } from "swr";
import { AIScreenReportDb } from "../types/ai-record.type";
import React, { createContext, useContext } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { buildUrl } from "@/utils/build-url";
import {
  TimerStatus,
  useHomeTimerController,
} from "../logic/use-home-timer-controller";

interface HomeContextType {
  fetcher: {
    data: AIScreenReportDb[] | undefined;
    error: any;
    isLoading: boolean;
    mutate: KeyedMutator<AIScreenReportDb[]>;
  };

  controllerTime: {
    stopAutoCapture: () => void;
    startAutoCapture: () => void;
    isRunning: boolean;
    status: TimerStatus;
    countdown: number;
  };
}

const HomeContext = createContext<HomeContextType>({} as HomeContextType);

export function HomeProvider({ children }: { children: React.ReactNode }) {
  const url = buildUrl("image-upload");
  const fetcher = useFetch<AIScreenReportDb[]>(url);
  const timerController = useHomeTimerController(fetcher.mutate);

  const values: HomeContextType = {
    fetcher: { ...fetcher },
    controllerTime: { ...timerController },
  };
  return <HomeContext.Provider value={values}>{children}</HomeContext.Provider>;
}

export const useHomeContext = () => useContext(HomeContext);
