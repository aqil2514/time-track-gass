import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { Info } from "lucide-react";
import { open as openBrowser } from "@tauri-apps/plugin-shell";
import { message } from "@tauri-apps/plugin-dialog";
import { useMemo } from "react";
import { LogoutMenu } from "./avatar-menu/logout";
import { ToggleMode } from "./avatar-menu/toggle-mode";
import { ProfileAvatarHeader } from "./profile-avatar-header";
import { useUserSetting } from "@/hooks/use-user-settings";

export function ProfileAvatar() {
  const { user } = useAuth();
  const { data } = useUserSetting();

  const isVisibleToggle = useMemo(() => {
    if (!data) return false;
    return data?.tracker.allowedMode.length > 1;
  }, [data]);

  if (!user) {
    return (
      <div className="flex items-center justify-center">
        <div className="relative h-9 w-9 rounded-full bg-slate-800 overflow-hidden border border-white/5">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-linear-to-r from-transparent via-white/10 to-transparent" />

          <div className="h-full w-full flex items-center justify-center">
            <div className="h-4 w-4 rounded-full bg-slate-700/50" />
          </div>
        </div>
      </div>
    );
  }

  const handleOpenInfo = async () => {
    return await message("Coming Soon");
    // Logika asli tetap dipertahankan di bawah (commented out sesuai aslimu)
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
          className="relative h-9 w-9 rounded-full border border-white/10 hover:border-purple-500/50 hover:ring-4 hover:ring-purple-500/10 transition-all duration-300 p-0 overflow-hidden"
        >
          <Avatar className="h-full w-full">
            <AvatarImage src={"#"} alt={user?.username} />
            <AvatarFallback className="bg-linear-to-br from-purple-600 to-amber-500 text-white font-black text-[10px] tracking-tighter">
              {user?.username.slice(0, 2).toUpperCase() ?? "GU"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-64 bg-[#0f172a] border-slate-800 text-slate-200 shadow-2xl p-2 rounded-xl"
        align="end"
        sideOffset={8}
      >
        <ProfileAvatarHeader />

        <DropdownMenuSeparator className="bg-slate-800/50 mx-1" />

        <div className="py-1">
          {isVisibleToggle && <ToggleMode />}

          <DropdownMenuItem
            className="flex items-center px-3 py-2.5 cursor-pointer rounded-lg hover:bg-slate-800/50 transition-colors group"
            onSelect={handleOpenInfo}
          >
            <Info className="mr-3 h-4 w-4 text-slate-400 group-hover:text-purple-400" />
            <span className="text-xs font-medium">Informasi Penggunaan</span>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="bg-slate-800/50 mx-1" />

        <LogoutMenu />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
