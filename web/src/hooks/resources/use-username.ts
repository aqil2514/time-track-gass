import { useFetch } from "../use-fetch";
import { useMemo } from "react";

export interface ProfileIdAndUsername {
  username: string;
  id: string;
}

export function useUsername() {
  const fetcher = useFetch<ProfileIdAndUsername[]>(`/api/user-profile`);

  const data = useMemo(() => fetcher.data ?? [], [fetcher.data]);

  return {
    ...fetcher,
    data,
  };
}
