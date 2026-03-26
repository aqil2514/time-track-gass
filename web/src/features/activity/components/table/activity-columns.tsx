import { AIScreenReportDb } from "@/features/dashboard/interface/ai-screen-db.interface";
import { ColumnDef } from "@tanstack/react-table";
import { ActivityTableActions } from "./activity-table-action";
import { format } from "date-fns";
import { id } from 'date-fns/locale';

export const activityColumns: ColumnDef<AIScreenReportDb>[] = [
  {
    accessorKey: "created_at",
    header: "Aktivitas Pada",
    cell: ({ row }) => {
    const date = new Date(row.original.created_at);
    return format(date, "eeee, dd MMMM yyyy HH:mm", { locale: id });
  }
  },
  {
    accessorKey: "app_name",
    header: "Nama Aplikasi",
  },
  {
    accessorKey: "window_title",
    header: "Judul Jendela",
  },
  {
    accessorKey: "category",
    header: "Kategori",
  },
  {
    accessorKey: "actions",
    header: "Aksi",
    cell:({row}) => <ActivityTableActions data={row.original} />
  },
];
