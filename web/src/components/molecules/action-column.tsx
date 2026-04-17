import { ColumnDef } from "@tanstack/react-table";
import { LucideIcon, MoreHorizontal } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";

interface MenuItems {
  label: string;
  icon: LucideIcon;
  className?: string;
  onClick: () => void;
}

interface ActionCellProps {
  dropdownLabel: string;
  menuItems: MenuItems[];
  dropdownClassName?: string;
  actionAlignment?: "left" | "right";
}

const ActionCell: React.FC<ActionCellProps> = ({
  dropdownLabel,
  menuItems,
  dropdownClassName = "w-40",
  actionAlignment = "right",
}) => {
  const wrapperClass = actionAlignment === "left" ? "text-left" : "text-right";
  const dropdownAlign = actionAlignment === "left" ? "start" : "end";

  return (
    <div className={wrapperClass}>
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
          align={dropdownAlign}
          className={cn(
            `${dropdownClassName} bg-slate-900 border-slate-800 text-slate-200`,
          )}
        >
          <DropdownMenuLabel>{dropdownLabel}</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-800" />
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenuItem
                key={item.label}
                className={`cursor-pointer ${item.className ?? ""}`}
                onClick={item.onClick}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

interface CreateActionColumnConfig<TData> {
  columns: ColumnDef<TData>[];
  getMenuItems: (row: TData) => MenuItems[];
  dropdownLabel?: ((row: TData) => string) | string;
  dropdownWidth?: string;
  actionAlignment?: "left" | "right";
  position?: "start" | "end";
}

export function createActionColumn<TData>(
  config: CreateActionColumnConfig<TData>,
): ColumnDef<TData>[] {
  const {
    columns,
    getMenuItems,
    dropdownLabel = "Aksi",
    dropdownWidth = "w-40",
    actionAlignment = "right",
    position = "end",
  } = config;

  const actionColumn: ColumnDef<TData> = {
    id: "action",
    header: () => (
      <div className={actionAlignment === "left" ? "text-left" : "text-right"}>
        Aksi
      </div>
    ),
    cell: ({ row }) => (
      <ActionCell
        dropdownLabel={
          typeof dropdownLabel === "function"
            ? dropdownLabel(row.original)
            : dropdownLabel
        }
        menuItems={getMenuItems(row.original)}
        dropdownClassName={dropdownWidth}
        actionAlignment={actionAlignment}
      />
    ),
  };

  return position === "start"
    ? [actionColumn, ...columns]
    : [...columns, actionColumn];
}

