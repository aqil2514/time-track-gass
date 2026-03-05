import axios from "axios";
import { cookies } from "next/headers";

export async function fetcher<T>(url: string): Promise<T> {
  const cookiesStorage = await cookies();

  const { data } = await axios.get(url, {
    withCredentials: true,
    headers: {
      Authorization: `Bearer ${cookiesStorage.get("accessToken")}`,
    },
  });

  return data;
}
