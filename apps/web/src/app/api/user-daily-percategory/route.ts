import { apiServer } from "@/lib/api-server";
import { isAxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const user = searchParams.get("user");

  try {
    const { data } = await apiServer.get(`/supervisor/user-daily-percategory`, {
      params: { date, user },
    });

    return NextResponse.json(data);
  } catch (error) {
    if (isAxiosError(error)) {
      console.error(error)
      return NextResponse.json(
        { message: "Fetch data failed" },
        { status: error?.status ?? 500 },
      );
    }
    return NextResponse.json({ message: "Fetch data failed" }, { status: 500 });
  }
}