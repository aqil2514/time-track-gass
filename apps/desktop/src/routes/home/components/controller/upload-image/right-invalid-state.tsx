import { AlertTriangle, RefreshCw, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface InvalidImage {
  s3Key: string;
  reason: string;
  originalFilename?: string;
}

interface Props {
  slotId: number;
  invalidImages: InvalidImage[];
  onReupload: () => void;
}

export function RightInvalidState({ slotId, invalidImages, onReupload }: Props) {
  const hour = slotId < 10 ? `0${slotId}:00` : `${slotId}:00`;

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-6 p-8 animate-in fade-in zoom-in duration-500">
      {/* Visual Indicator */}
      <div className="relative">
        <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full" />
        <div className="relative bg-slate-950 border border-amber-500/50 p-6 rounded-3xl shadow-[0_0_30px_rgba(245,158,11,0.15)]">
          <AlertTriangle className="h-14 w-14 text-amber-500" />
        </div>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-white tracking-tight">
          Gambar Tidak Valid
        </h2>
        <p className="text-slate-400 text-[13px] max-w-70 mx-auto leading-relaxed">
          Beberapa gambar yang diupload untuk slot{" "}
          <span className="font-mono font-bold text-amber-400">{hour}</span>{" "}
          tidak dapat diproses.
        </p>
      </div>

      {/* Invalid image list */}
      <ScrollArea className="w-full max-w-sm h-40">
        <div className="space-y-2 pr-3">
          {invalidImages.map((img) => (
            <div
              key={img.s3Key}
              className="flex items-start gap-2 bg-slate-900/50 border border-amber-500/20 p-3 rounded-xl"
            >
              <XCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                {img.originalFilename && (
                  <p className="text-[10px] font-mono text-amber-400/80 leading-snug truncate max-w-[220px]">
                    {img.originalFilename.split(/[\\/]/).pop()}
                  </p>
                )}
                <p className="text-[11px] text-slate-300 leading-snug">
                  {img.reason}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Re-upload button */}
      <div className="w-full max-w-sm">
        <button
          onClick={onReupload}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-400 text-sm font-semibold hover:bg-amber-500/20 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Upload Ulang Semua ({invalidImages.length} gambar)
        </button>
      </div>

      <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">
        Slot {hour}
      </p>
    </div>
  );
}
