import { useForm } from "react-hook-form";
import { useUserSetting } from "../../providers/team-setting.provider";
import {
  settingTrackerSchema,
  settingTrackerSchemaType,
} from "../../schema/setting-tracker-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormFieldCheckboxGroup } from "@/components/forms/form-field-checkbox";
import { Button } from "@/components/ui/button";
import { TrackerMode, UserSettings } from "@/@types/auth";
import axios from "axios";

export function TrackerSetting() {
  const { userSetting, mutate } = useUserSetting();
  const form = useForm<settingTrackerSchemaType>({
    defaultValues: {
      allowedMode: userSetting?.settings?.tracker?.allowedMode || [],
    },
    resolver: zodResolver(settingTrackerSchema),
  });

  const onSubmit = async (values: settingTrackerSchemaType) => {
    const newSetting: UserSettings = {
      ...userSetting.settings,
      tracker: {
        ...userSetting.settings.tracker,
        allowedMode: values.allowedMode as TrackerMode[],
      },
    };

    try {
      await axios.patch(`/api/user/${userSetting.id}/settings`, newSetting);
      await mutate();
      alert("Konfigurasi berhasil diperbarui");
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const { isSubmitting } = form.formState;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, (e) => console.error(e))}
      className="space-y-4"
    >
      <FormFieldCheckboxGroup
        form={form}
        name="allowedMode"
        label="Mode yang diperbolehkan"
        options={[
          {
            value: "auto",
            label: "Otomatis",
          },
          {
            label: "Manual",
            value: "manual",
          },
        ]}
      />

      <Button disabled={isSubmitting} variant={"accent"}>
        {isSubmitting ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  );
}
