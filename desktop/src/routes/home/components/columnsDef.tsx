import { ColumnDef } from "@tanstack/react-table";
import { AIScreenReportDb } from "../types/ai-record.type";

// format date helper
export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export const columnDef: ColumnDef<AIScreenReportDb>[] = [
  {
    accessorKey: "created_at",
    header: "Date",
    cell: ({ getValue }) => {
      const raw = getValue<string>();
      return formatDate(raw);
    },
  },
  {
    accessorKey: "app_name",
    header: "App Name",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "window_title",
    header: "Window Title",
  },
  {
    accessorKey: "summary",
    header: "Summary",
  },
];