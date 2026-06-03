import { webUrl } from "@/constants/server-url";
import { apiServer } from "@/lib/api-server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookiesStorage = await cookies();
  try {
    await apiServer.post("auth/logout/supervisor");

    cookiesStorage.delete("access_token");
    return NextResponse.redirect(`${webUrl}/login`);
  } catch (error) {
    console.error(error);
    throw error;
  }
}
