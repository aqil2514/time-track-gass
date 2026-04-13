import { apiServer } from "@/lib/api-server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { data } = await apiServer.get("/supervisor/attendance/profile-config");
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    throw error;
  }
}