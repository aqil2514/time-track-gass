import { useNavigate } from "react-router";
import { Button } from "../ui/button";
import { LogOut } from "lucide-react";
import { load } from "@tauri-apps/plugin-store";

export function LogoutButton() {
  const navigate = useNavigate();

  const logoutHandler = async () => {
    const store = await load("auth.json");
    await store.delete("accessToken");
    await store.save();
    navigate("/login");
  };

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
