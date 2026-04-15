import React, { createContext, useContext, useMemo } from "react";
import { useQueryParams } from "@/hooks/use-query-params";
import { buildUrl } from "@/utils/build-url";
import { webUrl } from "@/constants/server-url";
import { useFetch } from "@/hooks/use-fetch";
import { KeyedMutator } from "swr";
import { AttendanceLogsQuery, AttendanceSummary } from "../interfaces/attendace-logs.interface";

export interface SummaryAttendanceContextType {
  query: AttendanceLogsQuery;
  data: AttendanceSummary[] | undefined; 
  error: Error | null;
  isLoading: boolean;
  mutate: KeyedMutator<AttendanceSummary[]>;
}

// Inisialisasi dengan null untuk pengecekan keamanan di custom hook
const SummaryAttendanceContext = createContext<SummaryAttendanceContextType | null>(null);

export function SummaryAttendanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { get } = useQueryParams();

  const query = useMemo<AttendanceLogsQuery>(
    () => ({
      mode: (get("mode") as "weekly" | "monthly") ?? "weekly",
      date: get("date")??"",
      month: get("month")??"",
      year: get("year")??"",
    }),
    [get]
  );

  const url = useMemo<string | null>(() => {
    const { mode, date, month, year } = query;

    if (mode === "weekly") {
      if (!date) return null;
      return buildUrl("/api/attendance/summary", webUrl, query);
    }

    if (mode === "monthly") {
      if (!month || !year) return null;
      return buildUrl("/api/attendance/summary", webUrl, query);
    }

    return null;
  }, [query]);

  const fetcher = useFetch<AttendanceSummary[]>(url);

  const values = useMemo(() => ({
    query,
    ...fetcher
  }), [query, fetcher]);

  return (
    <SummaryAttendanceContext.Provider value={values}>
      {children}
    </SummaryAttendanceContext.Provider>
  );
}

export const useSummaryAttendance = () => {
  const context = useContext(SummaryAttendanceContext);
  if (!context) {
    throw new Error("useSummaryAttendance must be used within a SummaryAttendanceProvider");
  }
  return context;
};