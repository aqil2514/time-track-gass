import { createActionColumn } from "@/components/molecules/action-column";
import { ActivityAdjustmentListDb } from "@/features/attendance/interfaces/activity-adjustment-list.interface";
import { useQueryParams } from "@/hooks/use-query-params";
import { formatToTime } from "@/utils/format-to-time";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash } from "lucide-react";

const columns: ColumnDef<ActivityAdjustmentListDb>[] = [
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

export function useListNoteColumns() {
  const { update } = useQueryParams();
  const listNoteColumn = createActionColumn(columns, (row) => [
    {
      label: "Edit",
      icon: Pencil,
      onClick: () =>
        update({
          listId: String(row.id),
          action: "edit",
        }),
    },
    {
      label: "Hapus",
      icon: Trash,
      className: "text-red-400 focus:text-red-400",
      onClick: () =>
        update({
          listId: String(row.id),
          action: "delete",
        }),
    },
  ]);

  return listNoteColumn;
}
