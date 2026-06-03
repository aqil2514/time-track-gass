import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useDivisionContext } from "../../provider/divisions.provider";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useMemo } from "react";
import axios from "axios";

export function DeleteDialogs() {
  const { state, dispatch, data } = useDivisionContext();

  const open = state.modal.openedModal === "delete";
  const id = state.modal.divisionId;

  // Mencari data yang akan dihapus untuk ditampilkan namanya di konfirmasi
  const selectedData = useMemo(() => {
    if (!open || !id) return undefined;
    return data.data.find((div) => div.id === id);
  }, [open, id, data.data]);

  const onOpenChange = (open: boolean) => {
    if (!open)
      return dispatch({
        type: "UPDATE_OPENED_MODAL",
        payload: { state: null },
      });
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/divisions/${id}`);
      alert("Divisi berhasil dihapus");
      dispatch({
        type: "UPDATE_OPENED_MODAL",
        payload: { state: null, divisionId: undefined },
      });
      data.mutate();
    } catch (error) {
      console.error(error);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-100 bg-[#1e293b] border-slate-700 text-white shadow-2xl">
        <DialogHeader className="flex flex-col items-center text-center">
          {/* Icon Peringatan */}
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>

          <DialogTitle className="text-xl font-semibold text-white">
            Hapus Divisi?
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Apakah Anda yakin ingin menghapus divisi{" "}
            <span className="text-white font-bold">
              {selectedData?.name || "ini"}
            </span>
            ? Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Ya, Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
