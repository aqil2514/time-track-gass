import { ControlledDialogContainer } from "@/components/containers/controlled-dialog-container";
import { useQueryParams } from "@/hooks/use-query-params";
import { UserManagementForm } from "../forms";

export function UserManagementAddDialog() {
  const { get, remove } = useQueryParams();
  const open = get("action") === "add";

  return (
    <ControlledDialogContainer
      open={open}
      onOpenChange={(open) => {
        if (!open) remove("action");
      }}
      title="Buat Manajemen User"
      description="Tambahkan aturan baru untuk user tertentu di ringkasan absen"
      className="sm:max-w-3xl"
    >
      <UserManagementForm submitHandler={(values) => console.log(values)} />
    </ControlledDialogContainer>
  );
}
