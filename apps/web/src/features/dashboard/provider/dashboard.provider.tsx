import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { buildUrl } from "@/utils/build-url";
import { ActivityData } from "../interface/acivity-data.interface";
import { webUrl } from "@/constants/server-url";
import { useQueryParams } from "@/hooks/use-query-params";

const PAGE_LIMIT = 20;

interface DashboardContextType {
  data: ActivityData[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  total: number;
  error: Error | undefined;
  loadMore: () => void;
}

const DashboardContext = createContext<DashboardContextType>({} as DashboardContextType);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { get } = useQueryParams();

  const date = get("date");
  const from = get("from");
  const to = get("to");
  const user = get("user");

  const hasDate = !!date || (!!from && !!to);
  const isCanFetch = hasDate && !!user;

  const [data, setData] = useState<ActivityData[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const filterKey = `${user}-${date}-${from}-${to}`;
  const prevFilterKey = useRef(filterKey);

  useEffect(() => {
    if (prevFilterKey.current !== filterKey) {
      prevFilterKey.current = filterKey;
      setData([]);
      setPage(1);
      setTotal(0);
    }
  }, [filterKey]);

  useEffect(() => {
    if (!isCanFetch) return;

    const isFirstPage = page === 1;
    if (isFirstPage) setIsLoading(true);
    else setIsLoadingMore(true);

    const params: Record<string, string> = { user, page: String(page), limit: String(PAGE_LIMIT) };
    if (date) params.date = date;
    else { params.from = from!; params.to = to!; }

    const url = buildUrl("api/user-activity", webUrl, params);

    fetch(url)
      .then((r) => r.json())
      .then((res: { data: ActivityData[]; total: number }) => {
        setTotal(res.total);
        setData((prev) => isFirstPage ? res.data : [...prev, ...res.data]);
      })
      .catch((e) => setError(e))
      .finally(() => {
        setIsLoading(false);
        setIsLoadingMore(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, page]);

  function loadMore() {
    setPage((p) => p + 1);
  }

  const hasMore = data.length < total;

  return (
    <DashboardContext.Provider value={{ data, isLoading, isLoadingMore, hasMore, total, error, loadMore }}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboardContext = () => useContext(DashboardContext);
