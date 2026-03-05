import { cookies } from "next/headers";
import { api } from "./api";
import { AuthUser } from "@/@types/auth";

export async function getMe(): Promise<AuthUser | null> {
  try {
    const cookiesStorage = await cookies();
    const access_token = cookiesStorage.get("access_token");

    if (!access_token) return null;

    const { data } = await api.get("/auth/me/supervisor", {
      headers: {
        access_token: access_token.value,
      },
    });

    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
}
