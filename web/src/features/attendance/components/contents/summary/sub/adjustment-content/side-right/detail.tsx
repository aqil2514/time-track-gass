/* eslint-disable @next/next/no-img-element */
import { formatToTime } from "@/utils/format-to-time";
import { useAdjustmentContent } from "@/features/attendance/provider/adjustment-content.provider";
import { useFetch } from "@/hooks/use-fetch";
import { AdjustmentContentDetail } from "@/features/attendance/interfaces/activity-adjustment-list.interface";
import { useState } from "react";
import { ZoomIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export function SideRightDetail() {
  const { state } = useAdjustmentContent();
  const { data, isLoading, error } = useFetch<AdjustmentContentDetail>(
    state.adjustmentId
      ? `/api/attendance/adjustment/${state.adjustmentId}`
      : null,
  );
  const [isZoomed, setIsZoomed] = useState(false);

  if (!state.adjustmentId) {
    return (
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 shadow-sm shadow-slate-950/20">
        <p className="text-sm font-semibold text-slate-100">
          Detail belum tersedia
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Pilih penyesuaian dari tabel untuk melihat informasi lengkap di panel
          kanan.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 shadow-sm shadow-slate-950/20">
        <p className="text-sm text-slate-400">Memuat detail...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 shadow-sm shadow-slate-950/20">
        <p className="text-sm text-slate-400">Gagal memuat detail.</p>
      </div>
    );
  }

  const selected = data;

  return (
    <>
      {/* Dialog Lightbox */}
      {selected.s3_key && (
        <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
          <DialogContent className="sm:max-w-7xl border-slate-700 bg-slate-900/20 p-2">
            <DialogTitle className="sr-only">Bukti Foto</DialogTitle>
            <DialogDescription className="sr-only">
              Foto bukti penyesuaian kehadiran
            </DialogDescription>
            <img
              src={selected.s3_key}
              alt="Bukti penyesuaian"
              className="w-full rounded-xl object-contain max-h-[80vh]"
            />
          </DialogContent>
        </Dialog>
      )}

      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 shadow-sm shadow-slate-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Detail Penyesuaian
            </p>
            <h2 className="text-xl font-semibold text-slate-100">
              {selected.adjustment.name}
            </h2>
          </div>
          <div className="rounded-2xl bg-slate-950/80 px-3 py-2 text-sm text-slate-300">
            {selected.date}
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <div className="grid gap-3 rounded-2xl border border-slate-700/60 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-200">Karyawan</p>
                <p className="text-sm text-slate-400">
                  {selected.profile.full_name}
                </p>
              </div>
              <span className="text-xs text-slate-500">
                {selected.profile.username}
              </span>
            </div>
            <div className="text-sm text-slate-400">
              Divisi: {selected.profile.division}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/60 p-4">
              <p className="text-sm text-slate-400">Durasi Terpengaruh</p>
              <p className="mt-2 text-lg font-semibold text-slate-100">
                {formatToTime(selected.affected_minutes, "minutes")}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/60 p-4">
              <p className="text-sm text-slate-400">Jenis Penyesuaian</p>
              <p className="mt-2 text-lg font-semibold text-slate-100">
                {selected.adjustment.name}
              </p>
            </div>
          </div>

          {/* Gambar Bukti */}
          {selected.s3_key && (
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/60 p-4">
              <p className="text-sm font-medium text-slate-200 mb-3">
                Bukti Foto
              </p>
              <div
                className="group relative cursor-zoom-in overflow-hidden rounded-xl border border-slate-700/40"
                onClick={() => setIsZoomed(true)}
              >
                <img
                  src={selected.s3_key}
                  alt="Bukti penyesuaian"
                  className="w-full max-h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.parentElement!.style.display = "none";
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/30">
                  <ZoomIn className="h-8 w-8 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-700/60 bg-slate-950/60 p-4">
            <p className="text-sm font-medium text-slate-200">Catatan</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {selected.adjustment.notes || "Tidak ada catatan tambahan."}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}