import { apiServer } from "@/lib/api-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const { data } = await apiServer.get("/supervisor/attendance/list-note");
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    await apiServer.post("/supervisor/attendance/list-note", body);
    return NextResponse.json({ message: "OK" });
  } catch (error) {
    console.error(error);
    throw error;
  }
}
