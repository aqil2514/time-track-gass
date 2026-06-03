import { ControlledDialogContainer } from "@/components/containers/controlled-dialog-container";
import { useTeams } from "../../providers/teams.provider";
import { useFetch } from "@/hooks/use-fetch";
import { UserSettings } from "@/@types/auth";
import { TeamSettingProvider } from "../../providers/team-setting.provider";
import { SettingContent } from "../settings/setting-context";
import { LoadingSpinner } from "@/components/atoms/loading-spinner";

export function SettingDialog() {
  const { state, dispatch, userData } = useTeams();
  const open = state.modal.settings.isOpen;
  const userId = state.modal.settings.userId;
  const handleClose = (open: boolean) => {
    if (!open) dispatch({ type: "CLOSE_SETTING_USER_MODAL" });
  };

  const { data, isLoading, mutate } = useFetch<{
    settings: UserSettings;
    id: string;
  }>(userId ? `/api/user/${userId}/settings` : null);

  if (!userId || !data) return null;
  const selectedUser = userData.data.find((user) => user.id === userId);

  return (
    <ControlledDialogContainer
      className="sm:max-w-5xl"
      title={`Pengaturan User`}
      description={`Tetapkan pengaturan untuk ${selectedUser?.full_name}`}
      open={open}
      onOpenChange={handleClose}
    >
      {isLoading ? (
        <LoadingSpinner label="Mengambil data..." />
      ) : (
        <TeamSettingProvider userSetting={data} mutate={mutate}>
          <SettingContent />
        </TeamSettingProvider>
      )}
    </ControlledDialogContainer>
  );
}
