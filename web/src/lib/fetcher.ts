import axios, { AxiosRequestConfig } from "axios";

export async function fetcher<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  try {
    const { data } = await axios.get<T>(url, {
      withCredentials: true,
      ...config,
    });

    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
