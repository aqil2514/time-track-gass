import { KeyedMutator } from "swr";
import React, { createContext, useContext } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { buildUrl } from "@/utils/build-url";
import { ActivityData } from "../interface/acivity-data.interface";
import { webUrl } from "@/constants/server-url";
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
  const from = get("from");
  const to = get("to");
  const user = get("user");

  const hasDate = !!date || (!!from && !!to);
  const isCanFetch = hasDate && !!user;

  const url = isCanFetch
    ? buildUrl("api/user-activity", webUrl, {
        ...(date ? { date } : { from, to }),
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
