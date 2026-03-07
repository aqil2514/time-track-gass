import { apiServer } from "@/lib/api-server";
import { isAxiosError } from "axios";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { data } = await apiServer.get(`/supervisor/user-profile`);

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
