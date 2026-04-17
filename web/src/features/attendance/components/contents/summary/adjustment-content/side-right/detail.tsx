import { formatToTime } from "@/utils/format-to-time";
import { useAdjustmentContent } from "@/features/attendance/provider/adjustment-content.provider";

export function SideRightDetail() {
  const { state, data } = useAdjustmentContent();
  const selected = data?.adjustmentContent?.find(
    (item) => String(item.id) === state.adjustmentId,
  );

  if (!selected) {
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

  return (
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

        <div className="rounded-2xl border border-slate-700/60 bg-slate-950/60 p-4">
          <p className="text-sm font-medium text-slate-200">Catatan</p>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {selected.adjustment.notes || "Tidak ada catatan tambahan."}
          </p>
        </div>
      </div>
    </div>
  );
}
