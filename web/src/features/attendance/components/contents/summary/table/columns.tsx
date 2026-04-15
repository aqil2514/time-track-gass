import { createActionColumn } from "@/components/molecules/action-column";
import { AttendanceSummary } from "@/features/attendance/interfaces/attendace-logs.interface";
import { useQueryParams } from "@/hooks/use-query-params";
import { formatToTime } from "@/utils/format-to-time";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash } from "lucide-react";

const columns: ColumnDef<AttendanceSummary>[] = [
  {
    accessorKey: "fullName",
    header: "Nama Karyawan",
  },
  {
    accessorKey: "division",
    header: "Divisi",
  },
  {
    accessorKey: "period",
    header: "Periode",
  },
  {
    accessorKey: "totalWorkTime",
    header: "Total Jam",
    cell: ({ row }) => formatToTime(row.original.totalWorkTime, "minutes"),
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "penalty",
    header: "Denda",
  },
];

export function useAttendanceLogsColumns() {
  const { update } = useQueryParams();
  const attendanceLogsColumn = createActionColumn(columns, (row) => [
    {
      label: "Edit",
      icon: Pencil,
      onClick: () =>
        update({
          attendanceId: String(row.id),
          action: "edit",
        }),
    },
    {
      label: "Hapus",
      icon: Trash,
      className: "text-red-400 focus:text-red-400",
      onClick: () =>
        update({
          attendanceId: String(row.id),
          action: "delete",
        }),
    },
  ], (row) => row.fullName);

  return attendanceLogsColumn;
}
