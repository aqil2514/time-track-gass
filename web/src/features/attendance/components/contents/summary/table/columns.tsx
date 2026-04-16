import { createActionColumn } from "@/components/molecules/action-column";
import { AttendanceSummary } from "@/features/attendance/interfaces/attendace-logs.interface";
import { useQueryParams } from "@/hooks/use-query-params";
import { formatToTime } from "@/utils/format-to-time";
import { ColumnDef } from "@tanstack/react-table";
import {
  Pencil,
  Trash,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge"; // Pastikan sudah ada component Badge shadcn
import { cn } from "@/lib/utils";

const columns: ColumnDef<AttendanceSummary>[] = [
  {
    accessorKey: "fullName",
    header: "Nama Karyawan",
    cell: ({ row }) => (
      <div className="font-medium text-slate-200">{row.original.fullName}</div>
    ),
  },
  {
    accessorKey: "division",
    header: "Divisi",
    cell: ({ row }) => (
      <div className="text-xs text-slate-400 bg-slate-800/50 w-fit px-2 py-0.5 rounded-md border border-slate-700">
        {row.original.division}
      </div>
    ),
  },
  {
    accessorKey: "period",
    header: "Periode",
    cell: ({ row }) => (
      <div className="text-xs text-slate-400 italic">{row.original.period}</div>
    ),
  },
  {
    accessorKey: "totalWorkTime",
    header: "Total Jam",
    cell: ({ row }) => {
      const minutes = row.original.totalWorkTime;
      return (
        <div className="flex items-center gap-2 font-mono text-sm">
          <Clock className="w-3 h-3 text-amber-500" />
          <span>{formatToTime(minutes, "minutes")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;

      const config = {
        Complete: {
          label: "Lengkap",
          class: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
          icon: <CheckCircle2 className="w-3 h-3" />,
        },
        Incomplete: {
          label: "Kurang",
          class: "bg-red-500/10 text-red-500 border-red-500/20",
          icon: <AlertCircle className="w-3 h-3" />,
        },
        Process: {
          label: "Proses",
          class: "bg-amber-500/10 text-amber-500 border-amber-500/20",
          icon: <Clock className="w-3 h-3 animate-pulse" />,
        },
      };

      const current = config[status];

      return (
        <Badge
          variant="outline"
          className={cn(
            "flex items-center gap-1.5 font-medium px-2.5 py-0.5",
            current.class,
          )}
        >
          {current.icon}
          {current.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "penalty",
    header: "Denda",
    cell: ({ row }) => {
      const penalty = row.original.penalty;
      const isNoPenalty = penalty === "-";

      return (
        <div
          className={cn(
            "font-semibold text-sm",
            isNoPenalty ? "text-slate-500" : "text-red-400",
          )}
        >
          {penalty}
        </div>
      );
    },
  },
];

export function useAttendanceLogsColumns() {
  const { update } = useQueryParams();
  const attendanceLogsColumn = createActionColumn(
    columns,
    (row) => [
      {
        label: "Detail",
        icon: Eye,
        onClick: () =>
          update({
            userId: String(row.id),
            action: "detail",
          }),
      },
      // {
      //   label: "Edit",
      //   icon: Pencil,
      //   onClick: () =>
      //     update({
      //       attendanceId: String(row.id),
      //       action: "edit",
      //     }),
      // },
      // {
      //   label: "Hapus",
      //   icon: Trash,
      //   className: "text-red-400 focus:text-red-400",
      //   onClick: () =>
      //     update({
      //       attendanceId: String(row.id),
      //       action: "delete",
      //     }),
      // },
    ],
    (row) => row.fullName,
  );

  return attendanceLogsColumn;
}
