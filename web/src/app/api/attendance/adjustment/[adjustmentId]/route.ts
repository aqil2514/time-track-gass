import { apiServer } from "@/lib/api-server";
import { isAxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ adjustmentId: string }> }
) {
  try {
    const { adjustmentId } = await params;
    
    const { data } = await apiServer.get(`/supervisor/attendance/adjustment/${adjustmentId}`);

    return NextResponse.json(data);
  } catch (error) {
    if (isAxiosError(error)) {
      return NextResponse.json(
        { message: error.response?.data?.message || "Failed to fetch user detail" },
        { status: error.response?.status ?? 500 }
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ adjustmentId: string }> },
) {
  try {
    const { adjustmentId } = await params;

    await apiServer.delete(`/supervisor/attendance/adjustment/${adjustmentId}`);

    return NextResponse.json({ message: "OK" });
  } catch (error) {
    if (isAxiosError(error)) {
      return NextResponse.json(
        { message: error.response?.data?.message || "Failed to delete user" },
        { status: error.response?.status ?? 500 },
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req:NextRequest,
  { params }: { params: Promise<{ adjustmentId: string }> },
) {
  try {
    const formData = await req.formData();
    const { adjustmentId } = await params;

    await apiServer.patchForm(`/supervisor/attendance/adjustment/${adjustmentId}`, formData);

    return NextResponse.json({ message: "OK" });
  } catch (error) {
    if (isAxiosError(error)) {
      return NextResponse.json(
        { message: error.response?.data?.message || "Failed to delete user" },
        { status: error.response?.status ?? 500 },
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}