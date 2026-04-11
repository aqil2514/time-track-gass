import { ActivityAdjusmentListDb } from "@/features/attendance/interfaces/activity-adjusment-list.interface";
import { formatToTime } from "@/utils/format-to-time";
import { ColumnDef } from "@tanstack/react-table";

export const listNoteColumn: ColumnDef<ActivityAdjusmentListDb>[] = [
  {
    accessorKey: "name",
    header: "Nama List",
  },
  {
    accessorKey: "added_minutes",
    header: "Default Penyesuaian",
    cell: ({ row }) => formatToTime(row.original.added_minutes, "minutes"),
  },
  {
    accessorKey: "notes",
    header: "Deskripsi List",
  },
];
