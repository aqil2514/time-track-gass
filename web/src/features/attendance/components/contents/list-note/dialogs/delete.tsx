import { ControlledDialogContainer } from "@/components/containers/controlled-dialog-container";
import { useQueryParams } from "@/hooks/use-query-params";
import { useListNote } from "@/features/attendance/provider/list-note-provider";
import axios from "axios";
import { Button } from "@/components/ui/button";

export function ListNoteDeleteDialog() {
  const { get, update } = useQueryParams();
  const { mutate, data } = useListNote();
  const open = get("action") === "delete";
  const listId = get("listId");

  const selectedData = data?.find((d) => String(d.id) === String(listId));

  const submitHandler = async () => {
    try {
      await axios.delete(`/api/attendance/list-note/${listId}`);
      await mutate();
      alert("Data berhasil dihapus");
      update({ action: null, listId: null });
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  if (!selectedData) return null;

  return (
    <ControlledDialogContainer
      open={open}
      onOpenChange={(open) => {
        if (!open) update({ action: null, listId: null });
      }}
      title="Hapus Kategori Penyesuaian"
      description={`Apakah kamu yakin ingin menghapus "${selectedData.name}"? Tindakan ini tidak dapat dibatalkan.`}
    >
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={() => update({ action: null, listId: null })}
        >
          Batal
        </Button>
        <Button variant="destructive" onClick={submitHandler}>
          Hapus
        </Button>
      </div>
    </ControlledDialogContainer>
  );
}