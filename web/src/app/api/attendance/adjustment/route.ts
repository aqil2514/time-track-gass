/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiServer } from "@/lib/api-server";
import { isAxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const { data } = await apiServer.post(
      `/supervisor/attendance/adjustment`,
      body,
    );

    return NextResponse.json(data);
  } catch (error) {
    if (isAxiosError(error)) {
      return NextResponse.json(
        { message: error.response?.data?.message || "Failed to create user" },
        { status: error.response?.status ?? 500 },
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  console.log("OK")
  
  try {
    const { data } = await apiServer.get("/supervisor/attendance/adjustment", {
      params: Object.fromEntries(searchParams),
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching attendance summary:", error?.response?.data || error.message);
    
    return NextResponse.json(
      { message: error?.response?.data?.message || "Internal Server Error" },
      { status: error?.response?.status || 500 }
    );
  }
}