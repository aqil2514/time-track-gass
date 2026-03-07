"use client";
import { useState } from "react";
import { Button } from "../ui/button";
import { LogOut } from "lucide-react";
import { Spinner } from "../ui/spinner";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const logoutHandler = async () => {
    try {
      setLoading(true);

      await api.post("auth/logout")
      router.replace("/login")
    } catch (error) {
      console.error(error);
      throw error; 
    } finally{
      setLoading(false)
    }
  }
  return (
    <Button
      variant="ghost"
      className="text-red-600 hover:text-red-700"
      size={"icon-lg"}
      disabled={loading}
      onClick={logoutHandler}
    >
      {loading ? <Spinner /> : <LogOut />}
    </Button>
  );
}
