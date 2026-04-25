"use client";

import { Eye, Key, MoreHorizontal, Pencil, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthUser } from "@/@types/auth";
import { useTeams } from "../providers/teams.provider";
import { useRouter } from "next/navigation";

interface TeamsTableActionsProps {
  user: AuthUser;
}

export function TeamsTableActions({ user }: TeamsTableActionsProps) {
  const { dispatch } = useTeams();
  const router = useRouter();

  const menuItems = [
    {
      label: "Lihat Aktivitas",
      icon: Eye,
      // Menggunakan Blue-400 dengan opacity sedikit rendah agar tidak terlalu 'neon'
      className:
        "cursor-pointer focus:bg-blue-500/10 focus:text-blue-400 text-blue-400/90",
      onClick: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        router.push(
          `/dashboard?user=${user.username}&date=${today.toISOString()}`,
        );
      },
    },
    {
      label: "Edit",
      icon: Pencil,
      className:
        "cursor-pointer focus:bg-slate-800 focus:text-white text-slate-300",
      onClick: () =>
        dispatch({
          type: "OPEN_EDIT_USER_MODAL",
          payload: { userId: user.id },
        }),
    },
    {
      label: "Reset Password",
      icon: Key,
      className:
        "cursor-pointer focus:bg-slate-800 focus:text-white text-slate-300",
      onClick: () =>
        dispatch({
          type: "OPEN_RESET_PASSWORD_USER_MODAL",
          payload: { userId: user.id },
        }),
    },
    {
      label: "Delete",
      icon: Trash2,
      className:
        "cursor-pointer focus:bg-red-500/10 focus:text-red-400 text-red-400",
      onClick: () =>
        dispatch({
          type: "OPEN_DELETE_USER_MODAL",
          payload: { userId: user.id },
        }),
    },
    {
      label: "Setting",
      icon: Settings,
      onClick: () =>
        dispatch({
          type: "OPEN_SETTING_USER_MODAL",
          payload: { userId: user.id },
        }),
    },
  ];
  return (
    <div className="text-right">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-slate-800 text-slate-400"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-40 bg-slate-900 border-slate-800 text-slate-200"
        >
          <DropdownMenuLabel>{user.username}</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-800" />

          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <DropdownMenuItem
                key={index}
                className={`cursor-pointer ${item.className}`}
                onClick={item.onClick}
              >
                <Icon className="mr-2 h-4 w-4" /> {item.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
