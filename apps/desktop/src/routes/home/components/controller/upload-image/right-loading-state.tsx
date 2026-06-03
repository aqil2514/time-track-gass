import { Loader2 } from "lucide-react";

export function RightLoadingState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-300">
      <div className="relative">
        <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse" />
        <Loader2 className="h-10 w-10 text-purple-500 animate-spin relative" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-slate-200">Menarik data slot...</p>
        <p className="text-[10px] text-slate-500 italic">Mohon tunggu sebentar</p>
      </div>
    </div>
  );
}