import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDivisionContext } from "../../provider/divisions.provider";
import { DivisionForm } from "../forms";
import { DivisionSchemaType } from "../../schemas/division.schema";
import axios from "axios";

export function AddDialogs() {
  const { state, dispatch } = useDivisionContext();

  const open = state.modal.openedModal === "add";

  const onOpenChange = (open: boolean) => {
    if (!open)
      return dispatch({
        type: "UPDATE_OPENED_MODAL",
        payload: { state: null },
      });
  };

  const addHandler = async (values:DivisionSchemaType) => {
    try {
      await axios.post("/api/divisions", values)
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-[#1e293b] border-slate-700 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            Tambah Divisi Baru
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Isi form di bawah ini untuk menambah divisi baru dalam organisasi.
          </DialogDescription>
        </DialogHeader>

        <DivisionForm
          submitHandler={addHandler}
          onCancelButton={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
