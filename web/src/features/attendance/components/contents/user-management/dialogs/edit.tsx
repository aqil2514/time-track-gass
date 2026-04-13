import { ControlledDialogContainer } from "@/components/containers/controlled-dialog-container";
import { useQueryParams } from "@/hooks/use-query-params";
import { UserManagementForm } from "../forms";
import { useMemo } from "react";
import { UserManagementInput } from "@/features/attendance/schema/user-management-schema";
import { useProfileConfig } from "@/features/attendance/provider/profile-config.provider";

export function UserManagementEditDialog() {
  const { data } = useProfileConfig();
  const { get, update } = useQueryParams();
  const open = get("action") === "edit";
  const userId = get("userId");

  const selectedData = useMemo<UserManagementInput | undefined>(() => {
    const selectedData = data?.find((d) => d.profile.id === userId);

    if (!selectedData) return undefined;

    return {
      monthlyHour: selectedData?.min_hours_monthly ?? 140,
      weeklyHour: selectedData?.min_hours_weekly ?? 35,
      hourlyBonus: selectedData.bonus_per_hour
        ? String(selectedData.bonus_per_hour)
        : "0",
      hourlyPenalty: selectedData.penalty_per_hour
        ? String(selectedData.penalty_per_hour)
        : "0",
      penaltyType: selectedData.penalty_per_hour > 0 ? "fee" : "daily-sync",
      userId: selectedData.profile.id,
    };
  }, [data, userId]);

  if(!selectedData) return null;

  return (
    <ControlledDialogContainer
      open={open}
      onOpenChange={(open) => {
        if (!open) update({ action: null, userId: null });
      }}
      title="Buat Manajemen User"
      description="Tambahkan aturan baru untuk user tertentu di ringkasan absen"
      className="sm:max-w-3xl"
    >
      <UserManagementForm
        defaultValues={selectedData}
        submitHandler={(values) => console.log(values)}
      />
    </ControlledDialogContainer>
  );
}
