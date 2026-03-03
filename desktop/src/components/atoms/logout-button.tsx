import { useNavigate } from "react-router";
import { Button } from "../ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const navigate = useNavigate();

  return (
    <Button
      variant="ghost"
      className="text-red-600 hover:text-red-700"
      size={"icon-lg"}
      onClick={() => {
        localStorage.removeItem("accessToken");
        navigate("/login");
      }}
    >
      <LogOut />
    </Button>
  );
}
