import { serverUrl } from "@/constants/server-url";
import axios from "axios";

export const api = axios.create({
  baseURL: serverUrl,
  withCredentials: true,
});
