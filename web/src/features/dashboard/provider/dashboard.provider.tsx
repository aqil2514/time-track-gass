import { KeyedMutator } from "swr";
import React, { createContext, useContext } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { buildUrl } from "@/utils/build-url";
import { ActivityData } from "../interface/acivity-data.interface";
import { serverUrl } from "@/constants/server-url";
import { useQueryParams } from "@/hooks/use-query-params";

interface DashboardContextType {
  data: ActivityData[] | undefined;
  error: Error;
  isLoading: boolean;
  mutate: KeyedMutator<ActivityData[]>;
}

const DashboardContext = createContext<DashboardContextType>(
  {} as DashboardContextType,
);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { get } = useQueryParams();

  const date = get("date");
  const user = get("user");

  const isCanFetch = !!date && !!user;

  const url = isCanFetch
    ? buildUrl("supervisor/user-activity", serverUrl, {
        date,
        user,
      })
    : null;

  const fetcher = useFetch<ActivityData[]>(url);

  const values: DashboardContextType = {
    ...fetcher,
  };
  return (
    <DashboardContext.Provider value={values}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboardContext = () => useContext(DashboardContext);
