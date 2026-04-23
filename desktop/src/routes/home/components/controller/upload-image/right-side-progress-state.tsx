import { Loader2, Clock, Zap } from "lucide-react";

export function RightSideProgress({ slotId }: { slotId: number }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
      {/* Icon Section dengan Animasi Pulse */}
      <div className="relative">
        <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse" />
        <div className="relative border-2 border-dashed border-purple-500 p-8 rounded-2xl bg-zinc-900/50">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        </div>
      </div>

      {/* Text Section */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Sedang Memproses</h2>
        <p className="text-zinc-400 max-w-70">
          Gambar kamu sedang dianalisis oleh AI. Mohon tunggu sebentar...
        </p>
      </div>

      {/* Info Cards (Mockup agar visualnya seimbang dengan 'Laporan Diterima') */}
      <div className="w-full max-w-sm space-y-3">
        <div className="flex items-center justify-between p-4 bg-zinc-900/80 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-3 text-zinc-300">
            <Clock size={18} className="text-purple-400" />
            <span className="text-sm">STATUS</span>
          </div>
          <span className="text-xs font-bold px-2 py-1 bg-purple-500/10 text-purple-400 rounded border border-purple-500/20 uppercase tracking-wider">
            In Queue
          </span>
        </div>

        <div className="flex items-center justify-between p-4 bg-zinc-900/80 rounded-xl border border-zinc-800 opacity-50">
          <div className="flex items-center gap-3 text-zinc-300">
            <Zap size={18} />
            <span className="text-sm text-zinc-500">AKTIVITAS</span>
          </div>
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            TERKUNCI
          </span>
        </div>
      </div>

      <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] pt-4">
        Processing Slot 0{slotId}:00
      </p>
    </div>
  );
}
