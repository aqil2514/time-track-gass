import { AlertCircle } from "lucide-react";

export function RightErrorState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-300">
      <div className="bg-rose-500/10 p-4 rounded-full mb-4">
        <AlertCircle className="h-8 w-8 text-rose-500" />
      </div>
      <h3 className="text-white font-bold mb-2">Gagal Memuat Data</h3>
      <p className="text-xs text-slate-400 max-w-62.5 mb-6 leading-relaxed">
        Terjadi masalah saat mencoba mengambil status slot jam ini. Pastikan
        koneksi internet kamu stabil.
      </p>
    </div>
  );
}
