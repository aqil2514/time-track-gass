import { ControlledDialogContainer } from "@/components/containers/controlled-dialog-container";
import { useQueryParams } from "@/hooks/use-query-params";
import { ListNoteForm } from "../forms";

export function ListNoteAddDialog() {
  const { get, remove } = useQueryParams();
  const open = get("action") === "add";

  return (
    <ControlledDialogContainer
      open={open}
      onOpenChange={(open) => {
        if (!open) remove("action");
      }}
      title="Buat Kategori Penyesuaian"
      description="Tambahkan template baru untuk mempermudah pencatatan cuti, sakit, atau kompensasi jam kerja"
      className="sm:max-w-3xl"
    >
      <ListNoteForm submitHandler={(values) => console.log(values)} />
    </ControlledDialogContainer>
  );
}
