import { apiServer } from "@/lib/api-server";
import { isAxiosError } from "axios";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { data } = await apiServer.get(`/supervisor/user`);
    return NextResponse.json(data);
  } catch (error) {
    if (isAxiosError(error)) {
      return NextResponse.json(
        { message: error.response?.data?.message || "Fetch users failed" },
        { status: error.response?.status ?? 500 },
      );
    }
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...nestData } = body;

    const { data } = await apiServer.post(`/supervisor/user`, nestData);

    return NextResponse.json(data);
  } catch (error) {
    if (isAxiosError(error)) {
      return NextResponse.json(
        { message: error.response?.data?.message || "Failed to create user" },
        { status: error.response?.status ?? 500 }
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}