import { KeyedMutator } from "swr";
import React, { createContext, useContext } from "react";
import { useFetch } from "@/hooks/use-fetch";

interface FetcherContextType<T> {
  data: T[] | undefined;
  error: Error;
  isLoading: boolean;
  mutate: KeyedMutator<T[]>;
}

export function createFetcherContext<T>() {
  const Context = createContext<FetcherContextType<T>>(
    {} as FetcherContextType<T>,
  );

  function Provider({
    children,
    url,
  }: {
    children: React.ReactNode;
    url: string | null;
  }) {
    const fetcher = useFetch<T[]>(url);
    return <Context.Provider value={fetcher}>{children}</Context.Provider>;
  }

  const useCtx = () => useContext(Context);

  return { Provider, useCtx };
}
