import { serverUrl } from "@/constants/server-url";
import { useFetch } from "../use-fetch";
import { useMemo } from "react";

export interface ProfileIdAndUsername {
  username: string;
  id: string;
}

export function useUsername() {
  const fetcher = useFetch<ProfileIdAndUsername[]>(
    `${serverUrl}/supervisor/user-profile`,
  );

  const data = useMemo(() => fetcher.data ?? [], [fetcher.data]);

  return {
    ...fetcher,
    data,
  };
}
