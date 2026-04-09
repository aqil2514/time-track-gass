"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AIScreenReportDb } from "@/features/dashboard/interface/ai-screen-db.interface";
import { Pencil, Trash } from "lucide-react";
import { useActivity } from "../provider/activity.provider";

interface Props {
  selectedData: AIScreenReportDb[];
}

export function ActivityBulkAction({ selectedData }: Props) {
  const { dispatch } = useActivity();
  const menuItems = [
    {
      label: "Hapus",
      icon: Trash,
      className:
        "cursor-pointer focus:bg-red-500/10 focus:text-red-400 text-red-400/90",
      onClick: () =>
        dispatch({
          type: "UPDATE_OPENED_MODAL",
          payload: {
            state: "bulk-delete",
            activityIds: selectedData.map((data) => data.id),
          },
        }),
    },
    {
      label: "Edit Kategori",
      icon: Pencil,
      className:
        "cursor-pointer focus:bg-blue-500/10 focus:text-blue-400 text-blue-400/90",
      onClick: () =>
        dispatch({
          type: "UPDATE_OPENED_MODAL",
          payload: {
            state: "bulk-edit-category",
            activityIds: selectedData.map((data) => data.id),
          },
        }),
    },
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="hover:bg-slate-800 text-slate-400">
          Aksi untuk {selectedData.length} data
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40 bg-slate-900 border-slate-800 text-slate-200">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            Aksi untuk {selectedData.length} data
          </DropdownMenuLabel>
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
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
