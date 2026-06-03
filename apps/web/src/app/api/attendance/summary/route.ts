/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiServer } from "@/lib/api-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  
  try {
    const { data } = await apiServer.get("/supervisor/attendance/summary", {
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