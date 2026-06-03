import { buildUrl } from "@/utils/build-url";
import { useFetch } from "./use-fetch";
import { UserSettings } from "@/@types/user";

export function useUserSetting() {
  const url = buildUrl("auth/setting");
  const fetcher = useFetch<UserSettings>(url);

  return { ...fetcher };
}
