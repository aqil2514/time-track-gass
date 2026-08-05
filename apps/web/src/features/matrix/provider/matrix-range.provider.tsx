"use client";

import { KeyedMutator } from "swr";
import React, { createContext, useContext } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { buildUrl } from "@/utils/build-url";
import { webUrl } from "@/constants/server-url";
import { useQueryParams } from "@/hooks/use-query-params";
import { MultiDayMatrixResponse } from "../types/matrix.types";

interface MatrixRangeContextType {
  data: MultiDayMatrixResponse[] | undefined;
  error: Error;
  isLoading: boolean;
  mutate: KeyedMutator<MultiDayMatrixResponse[]>;
}

const MatrixRangeContext = createContext<MatrixRangeContextType>(
  {} as MatrixRangeContextType,
);

export function MatrixRangeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { get } = useQueryParams();

  const from = get("from") || undefined;
  const to = get("to") || undefined;

  const url = React.useMemo(() => {
    return buildUrl("api/user-activity-matrix-range", webUrl, { from, to });
  }, [from, to]);

  const fetcher = useFetch<MultiDayMatrixResponse[]>(
    from && to ? url : null,
  );

  return (
    <MatrixRangeContext.Provider value={{ ...fetcher }}>
      {children}
    </MatrixRangeContext.Provider>
  );
}

export const useMatrixRangeContext = () => useContext(MatrixRangeContext);
