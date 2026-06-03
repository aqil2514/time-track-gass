import { LabelValue } from "@/@types/general";
import { FormFieldCurrency } from "@/components/forms/form-field-currency";
import { FormFieldNumber } from "@/components/forms/form-field-number";
import { FormFieldSelect } from "@/components/forms/form-field-select";
import { Button } from "@/components/ui/button";
import {
  defaultUserManagement,
  UserManagementInput,
  UserManagementOutput,
  userManagementSchema,
} from "@/features/attendance/schema/user-management-schema";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { UserIdSelect } from "./user-id-select";
import { useProfileConfig } from "@/features/attendance/provider/profile-config.provider";

interface Props {
  defaultValues?: UserManagementInput;
  submitHandler: (values: UserManagementOutput) => Promise<void> | void;
}

const penaltyItems: LabelValue<string>[] = [
  {
    label: "Denda",
    value: "fee",
  },
  {
    label: "Daily Sync",
    value: "daily-sync",
  },
];

export function UserManagementForm({ submitHandler, defaultValues }: Props) {
  const { data } = useProfileConfig();
  const form = useForm<UserManagementInput, unknown, UserManagementOutput>({
    defaultValues: defaultValues ?? defaultUserManagement,
    resolver: zodResolver(userManagementSchema),
  });

  const penaltyType = useWatch({
    control: form.control,
    name: "penaltyType",
  });

  const selectedUser = useWatch({
    control: form.control,
    name: "userId",
  });

  const isEdit = !!defaultValues;
  const isExistingData = data?.some((d) => d.profile.id === selectedUser);
  const isSubmitting = form.formState.isSubmitting;
  return (
    <form
      onSubmit={form.handleSubmit(submitHandler, () =>
        alert(
          "Data yang diminta belum lengkap. Pastikan semua field wajib sudah diisi",
        ),
      )}
      className="space-y-4"
    >
      <UserIdSelect form={form} isEdit={isEdit} />
      <div className="grid grid-cols-2 gap-4 items-center">
        <FormFieldNumber
          form={form}
          name="weeklyHour"
          label="Jam Kerja Mingguan"
        />
        <FormFieldNumber
          form={form}
          name="monthlyHour"
          label="Jam Kerja Bulanan"
        />
      </div>
      <FormFieldSelect
        form={form}
        name="penaltyType"
        label="Jenis Pinalti"
        options={penaltyItems}
      />
      <div
        className={cn(
          "grid grid-cols-2 gap-4 items-center",
          penaltyType !== "fee" && "grid-cols-1",
        )}
      >
        {penaltyType === "fee" && (
          <FormFieldCurrency
            form={form}
            name="hourlyPenalty"
            label="Denda Perjam"
          />
        )}
        <FormFieldCurrency
          form={form}
          name="hourlyBonus"
          label="Bonus Perjam"
        />
      </div>

      {!isEdit && isExistingData && (
        <p className="text-sm text-red-400">
          Data user sudah ada. Lakukan edit data saja.
        </p>
      )}
      <Button
        variant={"accent"}
        disabled={isSubmitting || (!isEdit && isExistingData)}
      >
        {isSubmitting ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  );
}
