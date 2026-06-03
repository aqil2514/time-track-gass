import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { LogOut } from "lucide-react";

export function LogoutMenu() {
  const { logoutHandler } = useAuth();
  return (
    <DropdownMenuItem
      className="flex items-center px-3 py-2.5 text-red-400 focus:text-red-400 focus:bg-red-400/10 cursor-pointer rounded-lg transition-colors group"
      onSelect={logoutHandler}
    >
      <LogOut className="mr-3 h-4 w-4 transition-transform group-hover:-translate-x-1" />
      <span className="text-xs font-bold">Keluar Aplikasi</span>
    </DropdownMenuItem>
  );
}
