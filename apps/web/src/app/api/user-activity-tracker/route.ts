import { apiServer } from "@/lib/api-server";
import { isAxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const user = searchParams.get("user");
  const page = searchParams.get("page");
  const limit = searchParams.get("limit");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  try {
    const { data } = await apiServer.get(`/supervisor/tracker`, {
      params: { date, user, page, limit, from, to },
    });

    return NextResponse.json(data);
  } catch (error) {
    if (isAxiosError(error)) {
      return NextResponse.json(
        { message: "Fetch data failed" },
        { status: error?.status ?? 500 },
      );
    }
    return NextResponse.json({ message: "Fetch data failed" }, { status: 500 });
  }
}
