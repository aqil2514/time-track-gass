import { apiServer } from "@/lib/api-server";
import { isAxiosError } from "axios";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const body = await request.json();

    const { data } = await apiServer.patch(
      `/supervisor/attendance/profile-config/${userId}`,
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
