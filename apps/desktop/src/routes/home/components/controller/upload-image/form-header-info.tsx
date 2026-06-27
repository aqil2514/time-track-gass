import { cn } from "@/lib/utils";
import { UploadImageInput } from "@/routes/home/schema/upload-image.schema";
import { CheckCircle2, Info } from "lucide-react";
import { UseFormReturn, useWatch } from "react-hook-form";

interface Props {
  form: UseFormReturn<UploadImageInput>;
}

export function FormHeaderInfo({ form }: Props) {
  const imagesWatcher = useWatch({
    control: form.control,
    name: "images",
  });
  const uploadedCount = imagesWatcher.filter(
    (img) => img instanceof File,
  ).length;
  const isMinReached = uploadedCount >= 8;

  return (
    <div
      className={cn(
        "p-3 rounded-lg border flex items-start gap-3 transition-colors",
        isMinReached
          ? "bg-green-500/10 border-green-500/20"
          : "bg-amber-500/10 border-amber-500/20",
      )}
    >
      {isMinReached ? (
        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
      ) : (
        <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <p className="text-xs font-bold text-white">
          Status Pengunggahan: {uploadedCount}/8 Gambar
        </p>
        <p className="text-[10px] text-slate-400 leading-tight mt-1">
          Wajib minimal 8 screenshot yang memperlihatkan jam/tanggal sistem pada
          taskbar sebagai bukti otentik.
        </p>
        {!isMinReached && (
          <p className="text-[10px] text-slate-500 leading-tight mt-1">
            Tips: Beri nama file dengan format{" "}
            <span className="font-mono text-slate-400">
              YYYY-MM-DD_HH-mm-ss
            </span>{" "}
            (contoh: <span className="font-mono text-slate-400">2025-06-26_08-30-00.jpg</span>)
            sebagai cadangan jika sistem gagal membaca jam dari gambar.
          </p>
        )}
      </div>
    </div>
  );
}
