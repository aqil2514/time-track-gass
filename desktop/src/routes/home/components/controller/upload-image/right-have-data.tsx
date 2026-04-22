import { CheckCircle2, Lock, ShieldCheck, Zap } from "lucide-react";

interface Props {
  slotId: number;
}

export function RightSideHaveData({ slotId }: Props) {
  // Menghitung jam berikutnya untuk rentang waktu
  const nextHour = (slotId + 1) % 24;
  
  const formatTime = (hour: number) => 
    hour < 10 ? `0${hour}:00` : `${hour}:00`;

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-6 p-8 animate-in fade-in zoom-in duration-500">
      {/* Visual Success Indicator */}
      <div className="relative">
        <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full" />
        <div className="relative bg-slate-950 border border-green-500/50 p-6 rounded-3xl shadow-[0_0_30px_rgba(34,197,94,0.15)]">
          <CheckCircle2 className="h-14 w-14 text-green-500" />
          {/* Badge Terkunci */}
          <div className="absolute -top-2 -right-2 bg-slate-900 border border-slate-800 p-1.5 rounded-lg shadow-xl">
            <Lock className="h-3.5 w-3.5 text-slate-500" />
          </div>
        </div>
      </div>

      {/* Header & Thanks Message */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-black text-white tracking-tight">
          Laporan Diterima
        </h2>
        <p className="text-slate-400 text-[13px] max-w-70 mx-auto leading-relaxed">
          Terima kasih telah mengirimkan bukti kerja untuk periode:
          <span className="block mt-2 text-lg font-bold text-purple-400 font-mono">
            {formatTime(slotId)} — {formatTime(nextHour)}
          </span>
        </p>
      </div>

      {/* Status Tags */}
      <div className="flex flex-col gap-2 w-full max-w-70">
        <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            <span className="text-[11px] font-medium text-slate-300 uppercase">Status</span>
          </div>
          <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-md">
            VERIFIED
          </span>
        </div>

        <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-[11px] font-medium text-slate-300 uppercase">Aktivitas</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            TERKUNCI
          </span>
        </div>
      </div>

      {/* Footer Encouragement */}
      <div className="pt-4 flex flex-col items-center gap-1">
        <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">
          Keep Up The Good Work
        </p>
        <div className="h-1 w-8 bg-purple-500/30 rounded-full" />
      </div>
    </div>
  );
}