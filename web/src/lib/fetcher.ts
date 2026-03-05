import { cookies } from "next/headers";

export async function fetcher<T>(url: string): Promise<T> {
  const cookiesStorage = await cookies();

  const res = await fetch(url, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${cookiesStorage.get("accessToken")}`,
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
