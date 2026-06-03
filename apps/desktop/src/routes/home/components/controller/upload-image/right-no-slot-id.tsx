import { Clock, MousePointerClick } from "lucide-react";

export function RightNoSlotId() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30 p-8 text-center animate-in fade-in zoom-in duration-300">
      <div className="relative mb-4">
        {/* Dekorasi Glow di belakang Icon */}
        <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full" />
        <div className="relative bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-xl">
          <MousePointerClick className="h-8 w-8 text-purple-500" />
        </div>
      </div>

      <h3 className="text-sm font-bold text-white mb-1">
        Belum Ada Slot Terpilih
      </h3>
      <p className="text-[11px] text-slate-400 max-w-50 leading-relaxed">
        Silakan pilih salah satu{" "}
        <span className="text-purple-400 font-medium">Available Slot</span> di
        sebelah kiri untuk mulai mengunggah bukti aktivitas.
      </p>

      {/* Mini Indicator */}
      <div className="mt-6 flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
        <div className="h-px w-8 bg-slate-800" />
        <span>Aturan & Cara Kerja</span>
        <div className="h-px w-8 bg-slate-800" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 text-left w-full max-w-65">
        <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-slate-800/50 p-2 rounded-md border border-slate-700/50">
          <div className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 font-bold">
            1
          </div>
          <span>Pilih jam kerja yang sudah selesai (masa lalu)</span>
        </div>

        {/* Item Aturan Waktu yang Baru */}
        <div className="flex items-center gap-2 text-[10px] text-amber-400/90 bg-amber-500/5 p-2 rounded-md border border-amber-500/10">
          <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <Clock className="h-2.5 w-2.5" />
          </div>
          <span>Slot tersedia 1 jam setelah waktu tersebut berlalu</span>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-slate-800/50 p-2 rounded-md border border-slate-700/50">
          <div className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 font-bold">
            2
          </div>
          <span>Upload 8 SS taskbar (Interval min. 5 menit)</span>
        </div>
      </div>

      <p className="mt-6 text-[9px] text-slate-500 italic">
        * Contoh: Jika sekarang jam 10:54, slot terbaru yang terbuka adalah
        09:00 s/d 10:00.
      </p>
    </div>
  );
}
