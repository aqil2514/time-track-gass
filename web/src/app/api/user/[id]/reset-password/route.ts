import { apiServer } from "@/lib/api-server";
import { isAxiosError } from "axios";
import { NextResponse } from "next/server";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data } = await apiServer.patch(`/supervisor/user/${id}/reset-password`);

    return NextResponse.json(data);
  } catch (error) {
    if (isAxiosError(error)) {
      return NextResponse.json(
        { 
          message: error.response?.data?.message || "Failed to reset password" 
        },
        { status: error.response?.status ?? 500 }
      );
    }
    
    return NextResponse.json(
      { message: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}