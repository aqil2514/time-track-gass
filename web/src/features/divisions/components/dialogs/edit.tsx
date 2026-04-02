import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDivisionContext } from "../../provider/divisions.provider";
import { DivisionForm } from "../forms";
import { useMemo } from "react";
import { DivisionSchemaType } from "../../schemas/division.schema";

export function EditDialogs() {
  const { state, dispatch, data } = useDivisionContext();

  const open = state.modal.openedModal === "edit";
  const id = state.modal.divisionId

  const onOpenChange = (open: boolean) => {
    if (!open)
      return dispatch({
        type: "UPDATE_OPENED_MODAL",
        payload: { state: null },
      });
  };

  const valuesData = useMemo(() => {
    if(!open || !id) return undefined

    const selected =data.data.find((div) => div.id === id)

    if (!selected) return undefined

    const mapped:DivisionSchemaType = {
      description: selected?.description ?? "",
      name: selected.name,
      vision_config: selected.vision_config
    }

    return mapped
  }, [open, id, data.data])

  if (!open) return;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-[#1e293b] border-slate-700 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            Edit Divisi
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Isi form di bawah ini untuk menambah divisi baru dalam organisasi.
          </DialogDescription>
        </DialogHeader>

        <DivisionForm
          submitHandler={(values) => console.log(values)}
          onCancelButton={() => onOpenChange(false)}
          defaultValues={valuesData}
        />
      </DialogContent>
    </Dialog>
  );
}
