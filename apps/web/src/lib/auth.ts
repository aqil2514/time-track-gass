import axios from "axios";
import { AuthUser } from "@/@types/auth";
import { serverUrl } from "@/constants/server-url";
import { cookies } from "next/headers";

export async function getMe(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) return null;

    const { data } = await axios.get(`${serverUrl}/auth/me/supervisor`, {
      headers: {
        Cookie: `access_token=${token}`,
      },
    });

    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
}