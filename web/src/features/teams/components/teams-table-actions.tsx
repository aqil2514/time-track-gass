"use client";

import { Key, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
// import { useTeams } from "../providers/teams.provider";

interface TeamsTableActionsProps {
  user: AuthUser;
  onEdit: (id: string) => void;
  onDelete: (user: AuthUser) => void;
}

export function TeamsTableActions({
  user,
  onEdit,
  onDelete,
}: TeamsTableActionsProps) {
  // const { dispatch } = useTeams();
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

          <DropdownMenuItem
            className="cursor-pointer focus:bg-slate-800 focus:text-white"
            onClick={() => onEdit(user.id)}
          >
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer focus:bg-red-900/50 focus:text-red-400 text-red-400"
            onClick={() => onDelete(user)} // Panggil onDelete dengan data user lengkap
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer focus:bg-blue-900/50 focus:text-blue-400 text-blue-400"
            onClick={() => alert("Dalam Pengembangan")}
            // onClick={() =>
            //   dispatch({
            //     type: "OPEN_RESET_PASSWORD_USER_MODAL",
            //     payload: { userId: user.id },
            //   })
            // }
          >
            <Key className="mr-2 h-4 w-4" /> Reset Password
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
