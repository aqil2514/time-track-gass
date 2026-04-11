import { ControlledDialogContainer } from "@/components/containers/controlled-dialog-container";
import { useQueryParams } from "@/hooks/use-query-params";
import { ListNoteForm } from "../forms";
import {
  ListSchemaInput,
  ListSchemaType,
} from "@/features/attendance/schema/list-schema";
import axios from "axios";
import { useListNote } from "@/features/attendance/provider/list-note-provider";
import { useMemo } from "react";
import { minutesToTimeString } from "@/components/forms/form-field-time-picker";

export function ListNoteEditDialog() {
  const { get, update } = useQueryParams();
  const { mutate, data } = useListNote();
  const open = get("action") === "edit";

  const listId = get("listId");

  const submitHandler = async (values: ListSchemaType) => {
    try {
      await axios.patch("/api/attendance/list-note", { ...values, listId });
      await mutate();
      alert("Data berhasil diedit");
      update({ action: null, listId: null });
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const mappedData = useMemo<ListSchemaInput | undefined>(() => {
    const selectedData = data?.find((d) => String(d.id) === String(listId));
    if (!selectedData) return undefined;

    return {
      added_minutes: minutesToTimeString(selectedData.added_minutes),
      name: selectedData.name,
      notes: selectedData.notes,
    };
  }, [data, listId]);

  if (!mappedData) return null;

  return (
    <ControlledDialogContainer
      open={open}
      onOpenChange={(open) => {
        if (!open) update({ action: null, listId: null });
      }}
      title={"Edit Kategori Penyesuaian"}
      description={"Ubah template yang sudah ada"}
      className="sm:max-w-3xl"
    >
      <ListNoteForm submitHandler={submitHandler} defaultValues={mappedData} />
    </ControlledDialogContainer>
  );
}
