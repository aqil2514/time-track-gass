import { load } from "@tauri-apps/plugin-store";

export async function getToken() {
  const store = await load("auth.json");
  const token = await store.get<string>("accessToken");

  if (!token) throw new Error("AccessToken missing");

  return token;
}
