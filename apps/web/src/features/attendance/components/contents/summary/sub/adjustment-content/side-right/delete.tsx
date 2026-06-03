/* eslint-disable @next/next/no-img-element */
import { formatToTime } from "@/utils/format-to-time";
import { useAdjustmentContent } from "@/features/attendance/provider/adjustment-content.provider";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, ZoomIn } from "lucide-react";
import axios from "axios";
import { SetStateAction, useState } from "react";
import { useSummaryAttendance } from "@/features/attendance/provider/summary.provider";
import { useFetch } from "@/hooks/use-fetch";
import { AdjustmentContentDetail } from "@/features/attendance/interfaces/activity-adjustment-list.interface";
import { ZoomDialog } from "@/components/molecules/zoom-dialog";

const LoadingComp = () => {
  {
    return (
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 shadow-sm shadow-slate-950/20">
        <p className="text-sm text-slate-400">Memuat detail...</p>
      </div>
    );
  }
};

const ErrorComp = () => {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 shadow-sm shadow-slate-950/20">
      <p className="text-sm text-slate-400">Gagal memuat detail.</p>
    </div>
  );
};

const ImageAdjustment: React.FC<{
  setIsZoomed: React.Dispatch<SetStateAction<boolean>>;
  s3_key: string;
}> = ({ s3_key, setIsZoomed }) => {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-950/60 p-4">
      <p className="text-sm font-medium text-slate-200 mb-3">Bukti Foto</p>
      <div
        className="group relative cursor-zoom-in overflow-hidden rounded-xl border border-slate-700/40"
        onClick={() => setIsZoomed(true)}
      >
        <img
          src={s3_key}
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
  );
};

export function SideRightDelete() {
  const { state, mutate, dispatch } = useAdjustmentContent();
  const { mutate: mutateParent } = useSummaryAttendance();
  const [isDeleting, setIsDeleting] = useState(false);
  const { data, isLoading, error } = useFetch<AdjustmentContentDetail>(
    state.adjustmentId
      ? `/api/attendance/adjustment/${state.adjustmentId}`
      : null,
  );
  const [isZoomed, setIsZoomed] = useState(false);

  if (isLoading) return <LoadingComp />;

  if (error || !data) return <ErrorComp />;

  const selected = data;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await axios.delete(`/api/attendance/adjustment/${state.adjustmentId}`);
      alert("Penyesuaian berhasil dihapus.");
      await mutate();
      await mutateParent();
      dispatch({
        type: "SET_ACTION",
        payload: { action: "standby", adjustmentId: null },
      });
    } catch (error) {
      console.error("Error deleting adjustment:", error);
      alert("Gagal menghapus penyesuaian. Silakan coba lagi.");
      setIsDeleting(false);
    }
  };

  if (!selected) {
    return (
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 shadow-sm shadow-slate-950/20">
        <p className="text-sm font-semibold text-slate-100">
          Hapus belum tersedia
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Pilih penyesuaian dari tabel untuk menghapus di panel kanan.
        </p>
      </div>
    );
  }

  return (
    <>
      {selected.s3_key && (
        <ZoomDialog
          isOpen={isZoomed}
          onClose={setIsZoomed}
          imageSrc={selected.s3_key}
        />
      )}

      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 shadow-sm shadow-slate-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Hapus Penyesuaian
            </p>
            <h2 className="text-xl font-semibold text-slate-100">
              {selected.adjustment.name}
            </h2>
          </div>
          <div className="rounded-2xl bg-red-950/80 px-3 py-2 text-sm text-red-300">
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

          {selected.s3_key && (
            <ImageAdjustment
              setIsZoomed={setIsZoomed}
              s3_key={selected.s3_key}
            />
          )}

          <div className="rounded-2xl border border-red-700/60 bg-red-950/60 p-4">
            <p className="text-sm font-medium text-red-200">Peringatan</p>
            <p className="mt-3 text-sm leading-6 text-red-400">
              Tindakan ini tidak dapat dibatalkan. Penyesuaian ini akan dihapus
              secara permanen.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Hapus Penyesuaian
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
