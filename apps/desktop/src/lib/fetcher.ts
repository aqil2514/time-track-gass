import { fetch } from "@tauri-apps/plugin-http";
import { load } from "@tauri-apps/plugin-store";

export async function fetcher<T>(url: string): Promise<T> {
  const store = await load("auth.json");
  const token = await store.get<string>("accessToken");

  const res = await fetch(url, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    // @ts-expect-error Bawaan
    error.status = res.status;
    throw error;
  }

  return res.json();
}