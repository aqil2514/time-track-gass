import { Button } from "../ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function LogoutButton() {
  const { logoutHandler } = useAuth();

  return (
    <Button
      variant="ghost"
      className="text-red-600 hover:text-red-700"
      size={"icon-lg"}
      onClick={logoutHandler}
    >
      <LogOut />
    </Button>
  );
}
