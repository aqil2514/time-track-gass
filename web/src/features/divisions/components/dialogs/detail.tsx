import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDivisionContext } from "../../provider/divisions.provider";
import React, { useMemo } from "react";
import { DivisionsDb } from "../../interfaces/divisions.interface";
import { Badge } from "@/components/ui/badge"; // Pastikan ada component badge shadcn
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info, Eye } from "lucide-react";

export function DetailDialogs() {
  const { state, dispatch, data } = useDivisionContext();

  const open = state.modal.openedModal === "detail";
  const id = state.modal.divisionId;

  const onOpenChange = (open: boolean) => {
    if (!open)
      return dispatch({
        type: "UPDATE_OPENED_MODAL",
        payload: { state: null },
      });
  };

  const selectedData = useMemo(() => {
    if (!open || !id) return undefined;
    return data.data.find((div) => div.id === id);
  }, [open, id, data.data]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-[#1e293b] border-slate-700 text-white shadow-2xl p-0 overflow-hidden">
        <div className="p-6">
          <Header data={selectedData} />
          {selectedData && <Content data={selectedData} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const Header: React.FC<{ data: DivisionsDb | undefined }> = ({ data }) => {
  if (!data) return (
    <DialogHeader className="mb-4">
      <DialogTitle className="text-xl font-semibold text-red-400">Divisi Tidak Ada</DialogTitle>
      <DialogDescription className="text-slate-400">Data tidak ditemukan.</DialogDescription>
    </DialogHeader>
  );

  return (
    <DialogHeader className="mb-4">
      <div className="flex items-center gap-2 text-amber-500 mb-1">
        <Info className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Informasi Divisi</span>
      </div>
      <DialogTitle className="text-2xl font-bold text-white">
        {data.name}
      </DialogTitle>
      <DialogDescription className="text-slate-400">
        Dibuat pada {new Date(data.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
      </DialogDescription>
    </DialogHeader>
  );
};

const Content: React.FC<{ data: DivisionsDb }> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Deskripsi Umum */}
      <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800">
        <p className="text-sm text-slate-300 leading-relaxed italic">
          &quot;{data.description}&quot;
        </p>
      </div>

      <Separator className="bg-slate-800" />

      {/* Vision Config Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-amber-500">
          <Eye className="w-4 h-4" />
          <h3 className="text-[11px] font-bold uppercase tracking-widest">Vision Configuration</h3>
        </div>

        <ScrollArea className="h-75 pr-4">
          <div className="space-y-4">
            {data.vision_config.allowed_categories.map((cat) => (
              <div 
                key={cat} 
                className="p-4 border border-slate-700/50 rounded-lg bg-slate-800/30 group hover:border-amber-500/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20">
                    {cat}
                  </Badge>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {data.vision_config.category_definitions[cat] || "Tidak ada definisi tersedia."}
                </p>
              </div>
            ))}
            
            {data.vision_config.allowed_categories.length === 0 && (
              <p className="text-center text-slate-500 text-sm py-4">
                Tidak ada konfigurasi vision untuk divisi ini.
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};