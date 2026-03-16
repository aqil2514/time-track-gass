"use client";

import { ColumnDef } from "@tanstack/react-table";
import { TeamsTableActions } from "./teams-table-actions";
import { AuthUser } from "@/@types/auth";

// Fungsi sekarang menerima onEdit yang hanya membutuhkan string ID
export const getColumns = (
  onEdit: (id: string) => void,
  onDelete: (id: string) => void
): ColumnDef<AuthUser>[] => [
  {
    accessorKey: "full_name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-slate-200">{row.original.full_name}</span>
        <span className="text-xs text-slate-500">@{row.original.username}</span>
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <span className="text-slate-300">{row.getValue("email")}</span>,
  },
  {
    accessorKey: "division",
    header: "Division",
    cell: ({ row }) => (
      <span className="inline-flex items-center rounded-md bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-400 ring-1 ring-inset ring-slate-700">
        {row.getValue("division")}
      </span>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => <span className="capitalize text-slate-400">{row.getValue("role")}</span>,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="text-right">
        <TeamsTableActions 
          user={row.original} 
          onEdit={() => onEdit(row.original.id)}
          onDelete={() => onDelete(row.original.id)}
        />
      </div>
    ),
  },
];