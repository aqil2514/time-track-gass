import { apiServer } from "@/lib/api-server";
import { isAxiosError } from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const cookiesStorage = await cookies();
  try {
    const { data } = await apiServer.post("auth/login/supervisor", body);

    cookiesStorage.set("access_token", data.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
    });

    return NextResponse.json({ message: 'Login Success' });
  } catch (error) {
    if (isAxiosError(error)) {
      return NextResponse.json(
        error.response?.data,
        { status: error.response?.status }
      );
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}