import { AlertTriangle } from "lucide-react";

export function SideRightStandby() {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 shadow-sm shadow-slate-950/20">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-200">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <p className="text-base font-semibold text-slate-100">Mode Standby</p>
          <p className="text-sm leading-6 text-slate-400">
            Panel kanan akan menampilkan detail atau kontrol ketika user memilih item
            penyesuaian pada tabel.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-700/70 bg-slate-950/60 p-4 text-sm text-slate-400">
        <p className="font-medium text-slate-200">Langkah selanjutnya</p>
        <ul className="mt-3 space-y-2 list-disc pl-5 text-slate-400">
          <li>Pilih baris penyesuaian di tabel kiri.</li>
          <li>Klik tombol aksi untuk melihat detail, edit, atau hapus.</li>
          <li>Tombol kontrol akan muncul di panel kanan.</li>
        </ul>
      </div>
    </div>
  );
}