import { ColumnDef } from "@tanstack/react-table";
import { LucideIcon, MoreHorizontal } from "lucide-react";
import React from "react";
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
}

const ActionCell: React.FC<ActionCellProps> = ({ dropdownLabel, menuItems }) => {
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

export function createActionColumn<TData>(
  columns: ColumnDef<TData>[],
  getMenuItems: (row: TData) => MenuItems[],
  dropdownLabel: string = "Aksi",
): ColumnDef<TData>[] {
  return [
    ...columns,
    {
      id: "action",
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => (
        <ActionCell
          dropdownLabel={dropdownLabel}
          menuItems={getMenuItems(row.original)}
        />
      ),
    },
  ];
}