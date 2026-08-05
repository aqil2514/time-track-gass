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
import { useMemo, useState } from "react";
import { AIScreenReportDb } from "@/features/dashboard/interface/ai-screen-db.interface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppWindow, Clock, Tag, Pencil } from "lucide-react";
import { format } from "date-fns";
import { useDivisions } from "@/features/divisions/hooks/use-divisions";
import { useUserData } from "@/features/teams/hooks/use-user-data";
import axios from "axios";

export function BulkEditCategoryDialog() {
  const { state, dispatch, data } = useActivity();
  const { data: divisionData } = useDivisions();
  const { data: userData } = useUserData();
  const open = state.modal.openedModal === "bulk-edit-category";
  const items = state.modal.activityIds;

  const [selectedCategory, setSelectedCategory] = useState("");

  const selectedData = useMemo<AIScreenReportDb[]>(() => {
    if (!items) return [];

    const dbData = data.data.data;
    const result: AIScreenReportDb[] = [];

    for (const id of items) {
      const item = dbData.find((d) => d.id === id);
      if (item) result.push(item);
    }

    return result;
  }, [data.data.data, items]);

  const categoryList = useMemo(() => {
    if (!selectedData[0]) return [];

    const selectedUser = userData.find(
      (user) => user.id === selectedData[0].user_id,
    );

    if (!selectedUser) return [];

    const selectedDivision = divisionData.find(
      (division) => division.name === selectedUser.division,
    );

    const generalDivision = divisionData.find((division) => division.id === 8);

    const generalCategories = generalDivision?.vision_config.allowed_categories ?? [];
    const divisionCategories = selectedDivision?.vision_config.allowed_categories ?? [];

    const merged = [...new Set([...generalCategories, ...divisionCategories])];

    return ["unclassified", ...merged];
  }, [divisionData, userData, selectedData]);

  if (!items) return null;

  const handleClose = (open: boolean) => {
    if (!open) {
      setSelectedCategory("");
      dispatch({ type: "UPDATE_OPENED_MODAL", payload: { state: null } });
    }
  };

  const handleConfirm = async () => {
    if (!selectedCategory) return;

    try {
      await axios.patch("/api/user-activity/bulk/category", {
        activityIds: items,
        newCategory: selectedCategory,
      });

      alert("Data aktivitas user berhasil diupdate");
      handleClose(false);
      data.mutate();
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-[#0b0b14] border-slate-800 text-slate-200 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Pencil className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-100">
                Ubah Kategori
              </DialogTitle>
              <DialogDescription className="text-slate-400 mt-0.5">
                Kategori{" "}
                <span className="text-blue-400 font-semibold">
                  {items.length} data
                </span>{" "}
                berikut akan diubah ke kategori yang dipilih.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Pilih kategori baru */}
        <div className="px-6 pb-2 space-y-1.5">
          <p className="text-xs text-slate-400 font-medium">Kategori Baru</p>
          <Select
            value={selectedCategory}
            onValueChange={(val) => setSelectedCategory(val)}
          >
            <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200 focus:ring-blue-500/30">
              <SelectValue placeholder="Pilih kategori..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
              {categoryList.map((type) => (
                <SelectItem
                  key={type}
                  value={type}
                  className="focus:bg-slate-800 focus:text-slate-100"
                >
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* List preview item */}
        <ScrollArea className="max-h-96 px-6">
          <div className="space-y-2 pb-2">
            {selectedData.map((item, index) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800/40 transition-colors"
              >
                {/* Nomor urut */}
                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs flex items-center justify-center font-medium">
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
                      {/* Tampilkan kategori lama → baru */}
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 border-slate-700 text-slate-400 h-4"
                      >
                        {item.category}
                      </Badge>
                      {selectedCategory && (
                        <>
                          <span className="text-slate-600 text-xs">→</span>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 border-blue-700 text-blue-400 h-4"
                          >
                            {selectedCategory}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Info note */}
        <div className="mx-6 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
          <p className="text-xs text-blue-400/80 leading-relaxed">
            Perubahan kategori akan menimpa kategori yang sebelumnya ditetapkan
            oleh AI.
          </p>
        </div>

        <DialogFooter className="p-6 pt-4 gap-2">
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            onClick={() => handleClose(false)}
          >
            Batal
          </Button>
          <Button
            disabled={!selectedCategory}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            onClick={handleConfirm}
          >
            Ubah {items.length} Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
