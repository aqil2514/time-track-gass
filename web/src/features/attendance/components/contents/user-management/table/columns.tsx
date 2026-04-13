import { createActionColumn } from "@/components/molecules/action-column";
import { ProfileWorkConfigsPopulateProfile } from "@/features/attendance/interfaces/profile-work-configs.interface";
import { useQueryParams } from "@/hooks/use-query-params";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash } from "lucide-react";

const columns: ColumnDef<ProfileWorkConfigsPopulateProfile>[] = [
  {
    accessorKey: "profile.full_name",
    header: "Nama Lengkap",
  },
  {
    accessorKey: "profile.division",
    header: "Divisi",
  },
  {
    accessorKey: "penalty_per_hour",
    header: "Denda per Jam",
  },
  {
    accessorKey: "min_hours_weekly",
    header: "Minimal Jam Kerja Mingguan",
  },
  {
    accessorKey: "min_hours_monthly",
    header: "Minimal Jam Kerja Bulanan",
  },
  {
    accessorKey: "bonus_per_hour",
    header: "Bonus Jam Kerja",
  },
];

export function useUserManagementColumns() {
  const { update } = useQueryParams();
  const userManagementColumn = createActionColumn(columns, (row) => [
    {
      label: "Edit",
      icon: Pencil,
      onClick: () =>
        update({
          username: row.profile.id,
          action: "edit",
        }),
    },
    {
      label: "Hapus",
      icon: Trash,
      className: "text-red-400 focus:text-red-400",
      onClick: () =>
        update({
          username: row.profile.id,
          action: "delete",
        }),
    },
  ]);

  return userManagementColumn;
}
