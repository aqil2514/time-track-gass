"use client";

import { Eye, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActivity } from "../../provider/activity.provider";
import { AIScreenReportDb } from "@/features/dashboard/interface/ai-screen-db.interface";

interface ActivityTableActionsProps {
  data: AIScreenReportDb;
}

export function ActivityTableActions({ data }: ActivityTableActionsProps) {
  const { dispatch } = useActivity();

  const menuItems = [
    {
      label: "Lihat Aktivitas",
      icon: Eye,
      className:
        "cursor-pointer focus:bg-blue-500/10 focus:text-blue-400 text-blue-400/90",
      onClick: () =>
        dispatch({
          type: "UPDATE_OPENED_MODAL",
          payload: { state: "detail", activityId: data.id },
        }),
    },
  ];
  return (
    <div className="text-left">
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
          <DropdownMenuLabel>{data.app_name}</DropdownMenuLabel>
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
