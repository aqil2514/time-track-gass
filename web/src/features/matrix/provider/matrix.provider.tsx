import { KeyedMutator } from "swr";
import React, { createContext, useContext } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { buildUrl } from "@/utils/build-url";
import { webUrl } from "@/constants/server-url";
import { useQueryParams } from "@/hooks/use-query-params";
import { MatrixResponse } from "../types/matrix.types";

interface MatrixContextType {
  data: MatrixResponse[] | undefined;
  error: Error;
  isLoading: boolean;
  mutate: KeyedMutator<MatrixResponse[]>;
}

const MatrixContext = createContext<MatrixContextType>({} as MatrixContextType);

export function MatrixProvider({ children }: { children: React.ReactNode }) {
  const { get } = useQueryParams();

  const date = get("date") || undefined;

  const url = React.useMemo(() => {
    return buildUrl("api/user-activity-matrix", webUrl, { date });
  }, [date]);

  const fetcher = useFetch<MatrixResponse[]>(date ? url : null);

  const values: MatrixContextType = {
    ...fetcher,
  };
  return (
    <MatrixContext.Provider value={values}>{children}</MatrixContext.Provider>
  );
}

export const useMatrixContext = () => useContext(MatrixContext);
