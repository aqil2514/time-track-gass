import { serverUrl } from "@/constants/server-url";
import axios from "axios";

// Ini dipakek karena halangan di pengiriman cookies. Cookies itu harus samesite
// Jadi, dari user klik login => next api route => server. Kalo samesite bisa login => server
export const apiServer = axios.create({
  baseURL: serverUrl,
});
