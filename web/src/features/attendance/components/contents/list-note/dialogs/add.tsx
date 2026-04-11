import { ControlledDialogContainer } from "@/components/containers/controlled-dialog-container";
import { useQueryParams } from "@/hooks/use-query-params";
import { ListNoteForm } from "../forms";
import { ListSchemaType } from "@/features/attendance/schema/list-schema";
import axios from "axios";
import { useListNote } from "@/features/attendance/provider/list-note-provider";

export function ListNoteAddDialog() {
  const { get, remove } = useQueryParams();
  const { mutate } = useListNote();
  const open = get("action") === "add";

  const submitHandler = async (values: ListSchemaType) => {
    try {
      await axios.post("/api/attendance/list-note", values);
      await mutate();
      alert("Data berhasil ditambah");
      remove("action");
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

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
      <ListNoteForm submitHandler={submitHandler} />
    </ControlledDialogContainer>
  );
}
