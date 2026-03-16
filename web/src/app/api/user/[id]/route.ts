import { apiServer } from "@/lib/api-server";
import { isAxiosError } from "axios";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> } // Definisikan sebagai Promise
) {
  try {
    const { id } = await params;
    
    const { data } = await apiServer.get(`/supervisor/user/${id}`);

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, password, username, ...updateData } = body;

    const { data } = await apiServer.patch(`/supervisor/user/${id}`, updateData);

    return NextResponse.json(data);
  } catch (error) {
    if (isAxiosError(error)) {
      return NextResponse.json(
        { message: error.response?.data?.message || "Update failed" },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await apiServer.delete(`/supervisor/user/${id}`);

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    if (isAxiosError(error)) {
      return NextResponse.json(
        { message: error.response?.data?.message || "Failed to delete user" },
        { status: error.response?.status ?? 500 }
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}