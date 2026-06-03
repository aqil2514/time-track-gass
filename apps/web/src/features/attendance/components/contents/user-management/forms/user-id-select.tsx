import {
  FormFieldSelect,
  FormFieldSelectOptions,
} from "@/components/forms/form-field-select";
import { useProfileConfig } from "@/features/attendance/provider/profile-config.provider";
import {
  UserManagementInput,
  UserManagementOutput,
} from "@/features/attendance/schema/user-management-schema";
import { useMemo } from "react";
import { UseFormReturn } from "react-hook-form";

interface Props {
  form: UseFormReturn<UserManagementInput, unknown, UserManagementOutput>;
  isEdit: boolean;
}
export function UserIdSelect({ form, isEdit }: Props) {
  const { data } = useProfileConfig();

  const userIdOptions = useMemo<FormFieldSelectOptions[]>(() => {
    if (!data) return [];

    return data.map((d) => ({
      label: d.profile.username,
      value: d.profile.id,
    }));
  }, [data]);

  return (
    <FormFieldSelect
      form={form}
      disabled={isEdit}
      name="userId"
      label="User Pilihan"
      options={userIdOptions}
    />
  );
}
