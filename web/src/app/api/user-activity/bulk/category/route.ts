import { apiServer } from "@/lib/api-server";
import { isAxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  try {
    const { data } = await apiServer.patch(
      `/supervisor/activity/category`,
      body,
    );

    return NextResponse.json(data);
  } catch (error) {
    if (isAxiosError(error)) {
      return NextResponse.json(
        { message: error.response?.data?.message || "Update failed" },
        { status: error.response?.status ?? 500 },
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
