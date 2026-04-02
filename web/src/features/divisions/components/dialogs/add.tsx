import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDivisionContext } from "../../provider/divisions.provider";
import { DivisionForm } from "../forms";

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
          submitHandler={(values) => console.log(values)}
          onCancelButton={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
