import { serverUrl } from "@/constants/server-url";
import axios from "axios";
import { cookies } from "next/headers";

// Ini dipakek karena halangan di pengiriman cookies. Cookies itu harus samesite
// Jadi, dari user klik login => next api route => server. Kalo samesite bisa login => server
export const apiServer = axios.create({
  baseURL: serverUrl,
});

apiServer.interceptors.request.use(async (config) => {
  const cookiesStorage = await cookies();
  const token = cookiesStorage.get("access_token")?.value;

  if (token) {
    config.headers.Cookie = `access_token=${token}`;
  }

  return config;
});
