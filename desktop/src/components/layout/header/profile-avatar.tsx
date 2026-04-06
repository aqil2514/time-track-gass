import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { Info, LogOut } from "lucide-react"; // Tambahkan icon agar lebih pro
import { open as openBrowser } from "@tauri-apps/plugin-shell";
import { message } from "@tauri-apps/plugin-dialog";

export function ProfileAvatar() {
  const { logoutHandler, user } = useAuth();

  const handleOpenInfo = async () => {
    return await message("Coming Soon")
    try {
      await openBrowser(
        "https://abaft-fisher-2ed.notion.site/Dokumentasi-Penggunaan-Time-Track-31ef3fe6b1dd802ba87ff842fc17e73f?pvs=74",
      );
    } catch (error) {
      console.error("Gagal membuka server", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full border-2 border-slate-700 hover:border-purple-500 transition-all p-0"
        >
          <Avatar className="h-full w-full">
            <AvatarImage src={"#"} alt={user?.username} />
            <AvatarFallback className="bg-linear-to-br from-purple-600 to-amber-500 text-white font-bold text-xs">
              {user?.username.slice(0, 2).toUpperCase() ?? "GU"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56 bg-[#1e293b] border-slate-700 text-slate-200 shadow-2xl"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-white">
              {user?.username}
            </p>
            <p className="text-xs leading-none text-slate-400">
              {user?.email ?? "supervisor@timetrack.com"}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-slate-700" />

        {/* <DropdownMenuGroup>
          <DropdownMenuItem className="focus:bg-slate-800 focus:text-white cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profil</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="focus:bg-slate-800 focus:text-white cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Pengaturan</span>
          </DropdownMenuItem>
        </DropdownMenuGroup> */}

        <DropdownMenuSeparator className="bg-slate-700" />

        <DropdownMenuItem className="cursor-pointer" onSelect={handleOpenInfo}>
          <Info className="mr-2 h-4 w-4" />
          <span>Informasi Penggunaan</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-red-400 focus:text-red-400 cursor-pointer"
          onSelect={logoutHandler}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Keluar</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
