import { createActionColumn } from "@/components/molecules/action-column";
import { ProfileWorkConfigsPopulateProfile } from "@/features/attendance/interfaces/profile-work-configs.interface";
import { useQueryParams } from "@/hooks/use-query-params";
import { formatToRupiah } from "@/utils/format-to-rupiah";
import { formatToTime } from "@/utils/format-to-time";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil } from "lucide-react";

const columns: ColumnDef<ProfileWorkConfigsPopulateProfile>[] = [
  {
    accessorKey: "profile.full_name",
    header: "Nama Lengkap",
  },
  {
    accessorKey: "profile.username",
    header: "Username",
  },
  {
    accessorKey: "profile.division",
    header: "Divisi",
  },
  {
    accessorKey: "min_hours_weekly",
    header: "Minimal Jam Kerja Mingguan",
    cell: ({ row }) => {
      return row.original.min_hours_weekly
        ? formatToTime(row.original.min_hours_weekly, "hours")
        : "-";
    },
  },
  {
    accessorKey: "min_hours_monthly",
    header: "Minimal Jam Kerja Bulanan",
    cell: ({ row }) =>
      row.original.min_hours_weekly
        ? formatToTime(row.original.min_hours_monthly, "hours")
        : "-",
  },
  {
    accessorKey: "penalty_per_hour",
    header: "Denda per Jam",
    cell: ({ row }) => {
      switch (row.original.penalty_type) {
        case "daily-sync":
          return "Daily Sync";

        default:
          const feePerHour = row.original.penalty_per_hour;
          return feePerHour ? formatToRupiah(feePerHour) : "-";
      }
    },
  },
  {
    accessorKey: "bonus_per_hour",
    header: "Bonus Jam Kerja",
    cell: ({ row }) =>
      row.original.bonus_per_hour
        ? formatToRupiah(row.original.bonus_per_hour)
        : "-",
  },
];

export function useUserManagementColumns() {
  const { update } = useQueryParams();
  const userManagementColumn = createActionColumn(
    columns,
    (row) => [
      {
        label: "Edit",
        icon: Pencil,
        onClick: () =>
          update({
            userId: row.profile.id,
            action: "edit",
          }),
      },
    ],
    (row) => row.profile.username,
  );

  return userManagementColumn;
}
