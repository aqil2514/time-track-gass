import { AppLogInsert } from "@/@types/app_log";
import api from "@/lib/api";
import { load } from "@tauri-apps/plugin-store";
import { buildUrl } from "./build-url";
import { platform } from "@tauri-apps/plugin-os";

export async function writeLogToDb(payload: AppLogInsert) {
  const currentPlatform = platform();
  payload.os = currentPlatform;

  const store = await load("auth.json");
  const token = await store.get<string>("accessToken");

  if (!token) {
    throw new Error("Access token not found");
  }

  try {
    await api.post(buildUrl("log"), payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error("Failed to write log:", error);
    throw error;
  }
}