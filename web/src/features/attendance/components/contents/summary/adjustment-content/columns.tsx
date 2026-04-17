import { createActionColumn } from "@/components/molecules/action-column";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Trash } from "lucide-react";
import { formatToTime } from "@/utils/format-to-time";
import { AdjustmentContent } from "@/features/attendance/interfaces/activity-adjustment-list.interface";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAdjustmentContent } from "@/features/attendance/provider/adjustment-content.provider";

const columns: ColumnDef<AdjustmentContent>[] = [
  {
    accessorKey: "date",
    header: "Tanggal",
    cell: ({ row }) => (
      <div className="text-sm text-slate-300">{row.original.date}</div>
    ),
  },
  {
    accessorKey: "profile.username",
    header: "Username",
    cell: ({ row }) => (
      <div className="font-medium text-slate-200">
        {row.original.profile.username}
      </div>
    ),
  },
  {
    accessorKey: "profile.full_name",
    header: "Nama",
    cell: ({ row }) => (
      <div className="text-slate-100">{row.original.profile.full_name}</div>
    ),
  },
  {
    accessorKey: "profile.division",
    header: "Divisi",
    cell: ({ row }) => (
      <div className="text-xs text-slate-400 bg-slate-800/50 w-fit px-2 py-0.5 rounded-md border border-slate-700">
        {row.original.profile.division}
      </div>
    ),
  },

  {
    accessorKey: "adjustment.name",
    header: "Jenis Penyesuaian",
    cell: ({ row }) => (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="text-sm text-slate-200 cursor-help hover:text-slate-100 transition-colors">
            {row.original.adjustment.name}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-slate-900 border-slate-800 text-slate-200 text-xs px-3 py-2 shadow-xl max-w-xs"
        >
          <div className="flex flex-col gap-1">
            <span className="font-medium text-slate-300">Catatan:</span>
            <span className="text-slate-400">
              {row.original.adjustment.notes || "Tidak ada catatan"}
            </span>
          </div>
        </TooltipContent>
      </Tooltip>
    ),
  },
  {
    accessorKey: "affected_minutes",
    header: "Durasi",
    cell: ({ row }) => (
      <div className="font-medium text-slate-200">
        {formatToTime(row.original.affected_minutes, "minutes")}
      </div>
    ),
  },
];

export function useAdjustmentContentColumns() {
  const { dispatch } = useAdjustmentContent();
  return createActionColumn({
    columns,
    getMenuItems: (row) => [
      {
        label: "Detail",
        icon: Eye,
        onClick: () =>
          dispatch({
            type: "SET_ACTION",
            payload: { action: "detail", adjustmentId: String(row.id) },
          }),
      },
      {
        label: "Edit",
        icon: Pencil,
        onClick: () =>
          dispatch({
            type: "SET_ACTION",
            payload: { action: "edit", adjustmentId: String(row.id) },
          }),
      },
      {
        label: "Hapus",
        icon: Trash,
        className: "text-red-400 focus:text-red-400",
        onClick: () =>
          dispatch({
            type: "SET_ACTION",
            payload: { action: "delete", adjustmentId: String(row.id) },
          }),
      },
    ],
    dropdownLabel: (row) =>
      `${row.profile.username} | (${row.date}-${row.adjustment.name})`,
    dropdownWidth: "w-60",
    position: "start",
  });
}
