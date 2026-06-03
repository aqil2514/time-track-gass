import { ColumnDef } from "@tanstack/react-table";
import { DivisionsDb } from "../../interfaces/divisions.interface";
import { DivisionTableActions } from "./divisions-table-action";

export const divisionColumns: ColumnDef<DivisionsDb>[] = [
  {
    accessorKey: "name",
    header: "Nama Divisi",
  },
  {
    accessorKey: "description",
    header: "Deskripsi Divisi",
  },
  {
    accessorKey: "category_total",
    header: "Jumlah Kategori",
    cell: ({ row }) => `${row.original.vision_config.allowed_categories.length} Kategori`,
  },
  {
    accessorKey: "actions",
    header: "Aksi",
    cell: ({ row }) => <DivisionTableActions data={row.original} />,
  },
];
