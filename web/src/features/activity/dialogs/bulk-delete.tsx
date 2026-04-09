"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useActivity } from "../provider/activity.provider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMemo } from "react";
import { AIScreenReportDb } from "@/features/dashboard/interface/ai-screen-db.interface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AppWindow, Clock, Tag } from "lucide-react";
import { format } from "date-fns";
import axios from "axios";

export function BulkDeleteDialog() {
  const { state, dispatch, data } = useActivity();
  const open = state.modal.openedModal === "bulk-delete";
  const items = state.modal.activityIds;

  const deletedData = useMemo<AIScreenReportDb[]>(() => {
    if (!items) return [];

    const dbData = data.data;
    const deletedItems: AIScreenReportDb[] = [];

    for (const id of items) {
      const selectedItem = dbData.find((d) => d.id === id);
      if (selectedItem) deletedItems.push(selectedItem);
    }

    return deletedItems;
  }, [data.data, items]);

  if (!items) return null;

  const handleCloseDelete = (open: boolean) => {
    if (!open) {
      dispatch({ type: "UPDATE_OPENED_MODAL", payload: { state: null } });
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.patch("/api/user-activity/bulk/delete", {
        activityIds : items
      })
      
      alert("Data aktivitas user berhasil dihapus")
      dispatch({ type: "UPDATE_OPENED_MODAL", payload: { state: null } });
      data.mutate()
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseDelete}>
      <DialogContent className="sm:max-w-2xl bg-[#0b0b14] border-slate-800 text-slate-200 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-100">
                Konfirmasi Hapus Data
              </DialogTitle>
              <DialogDescription className="text-slate-400 mt-0.5">
                <span className="text-red-400 font-semibold">
                  {items.length} data
                </span>{" "}
                berikut akan dihapus permanen dan tidak dapat dikembalikan.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* List preview item yang akan dihapus */}
        <ScrollArea className="max-h-100 px-6">
          <div className="space-y-2 pb-2">
            {deletedData.map((item, index) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800/40 transition-colors"
              >
                {/* Nomor urut */}
                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-center font-medium">
                  {index + 1}
                </span>

                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* App name & window title */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-slate-200 font-medium text-sm">
                      <AppWindow className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.app_name}</span>
                    </div>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400 text-xs truncate">
                      {item.window_title}
                    </span>
                  </div>

                  {/* Summary */}
                  <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>

                  {/* Meta info */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1 text-slate-500 text-xs">
                      <Clock className="w-3 h-3" />
                      <span>
                        {format(
                          new Date(item.created_at),
                          "dd MMM yyyy, HH:mm",
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-slate-500" />
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 border-slate-700 text-slate-400 h-4"
                      >
                        {item.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Warning note */}
        <div className="mx-6 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <p className="text-xs text-amber-400/80 leading-relaxed">
            Data yang dihapus tidak akan ditampilkan, namun masih tersimpan dan
            dapat dipulihkan oleh administrator.
          </p>
        </div>

        <DialogFooter className="p-6 pt-4 gap-2">
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            onClick={() => handleCloseDelete(false)}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleConfirmDelete}
          >
            Hapus {items.length} Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
