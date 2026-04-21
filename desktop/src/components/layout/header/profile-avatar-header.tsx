import { Badge } from "@/components/ui/badge";
import { DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useUserSetting } from "@/hooks/use-user-settings";
import { useMemo } from "react";

export function ProfileAvatarHeader() {
  const { user } = useAuth();
  const { data: setting } = useUserSetting();
  const isAuto = useMemo(() => {
    if (!user) return false;
    return user?.settings.tracker.mode === "auto";
  }, [user]);
  return (
    <DropdownMenuLabel className="font-normal p-2">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold leading-none text-white tracking-tight">
            {user?.username}
          </p>
          <Badge
            variant="outline"
            className={`text-[9px] uppercase px-1.5 py-0 border-none font-bold ${
              isAuto
                ? "bg-purple-500/20 text-purple-400"
                : "bg-blue-500/20 text-blue-400"
            }`}
          >
            {setting?.tracker.mode}
          </Badge>
        </div>
        <p className="text-[11px] leading-none text-slate-500 truncate">
          {user?.email ?? "supervisor@timetrack.com"}
        </p>
      </div>
    </DropdownMenuLabel>
  );
}
