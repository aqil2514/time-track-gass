import { fetch } from "@tauri-apps/plugin-http";

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
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
