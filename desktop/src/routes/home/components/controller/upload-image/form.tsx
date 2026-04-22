import {
  defaultUploadImages,
  UploadImageInput,
  uploadImageSchema,
} from "@/routes/home/schema/upload-image.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { FormFieldImage } from "@/components/forms/form-field-image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PrimaryButton } from "@/components/atoms/primary-button";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Info,
  MousePointerClick,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { ErrorDataMap } from ".";

interface Props {
  defaultValues?: UploadImageInput;
  onSubmit: (values: UploadImageInput) => Promise<void> | void;
  selectedSlot: number | null;
  errorData: ErrorDataMap[];
  setErrorData: React.Dispatch<React.SetStateAction<ErrorDataMap[]>>;
}

export function UploadImageForm({
  onSubmit,
  defaultValues,
  selectedSlot,
  errorData,
  setErrorData,
}: Props) {
  const form = useForm<UploadImageInput>({
    defaultValues: defaultValues ?? defaultUploadImages,
    resolver: zodResolver(uploadImageSchema),
    mode: "onChange",
  });

  const { isSubmitting, errors } = form.formState;

  const imagesWatcher = form.watch("images") || [];
  const uploadedCount = imagesWatcher.filter(
    (img) => img instanceof File,
  ).length;
  const isMinReached = uploadedCount >= 8;

  useEffect(() => {
    setErrorData([]);
    if (selectedSlot === null) return;

    if (defaultValues?.slotId === selectedSlot) {
      // Mode edit — load data existing untuk slot ini
      form.reset(defaultValues);
    } else {
      // Mode create — slot baru, kosongkan images
      form.reset({
        ...defaultUploadImages,
        slotId: selectedSlot,
        images: [],
      });
    }
  }, [selectedSlot, defaultValues, form]);

  const getFileError = (index: number) => {
    const fileAtRef = imagesWatcher[index];
    if (!(fileAtRef instanceof File)) return null;

    return errorData?.find((err) => err.filename === fileAtRef.name);
  };

  const slotId = useWatch({
    control: form.control,
    name: "slotId",
  });

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col h-full min-h-0 space-y-4"
    >
      {/* Header Info Validasi */}
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
            Wajib minimal 8 screenshot yang memperlihatkan jam/tanggal sistem
            pada taskbar sebagai bukti otentik.
          </p>
        </div>
      </div>

      {/* Grid Slot Gambar */}
      {slotId !== null ? (
        <ScrollArea className="flex-1 min-h-0 pr-4">
          <div className="grid grid-cols-2 gap-4 pb-4">
            {Array.from({ length: 8 }).map((_, index) => {
              const serverError = getFileError(index);

              return (
                <div key={index} className="relative">
                  <FormFieldImage
                    form={form}
                    name={`images.${index}`}
                    label={`Screenshot ${index + 1}`}
                    placeholder="Paste SS Taskbar di sini"
                    // Tambahkan border merah jika ada error dari server
                    className={cn(
                      "min-h-45",
                      serverError &&
                        "border-rose-500 bg-rose-500/5 ring-1 ring-rose-500",
                    )}
                  />

                  {serverError && (
                    <div className="mt-1 flex items-center gap-1 text-rose-500 animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="h-3 w-3" />
                      <p className="text-[9px] font-medium leading-tight">
                        {serverError.reason}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      ) : (
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
            <span className="text-purple-400 font-medium">Available Slot</span>{" "}
            di sebelah kiri untuk mulai mengunggah bukti aktivitas.
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
      )}

      {/* Footer Action */}
      <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
        {errors.images && (
          <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 p-2 rounded-md border border-rose-500/20">
            <AlertCircle className="h-3 w-3" />
            <p className="text-[10px] font-medium">{errors.images.message}</p>
          </div>
        )}

        <PrimaryButton
          type="submit"
          disabled={isSubmitting || !isMinReached}
          className="w-full py-6 text-sm font-bold shadow-[0_0_20px_rgba(168,85,247,0.2)]"
        >
          {isSubmitting ? "Sedang Mengunggah..." : "Konfirmasi & Kirim Bukti"}
        </PrimaryButton>
      </div>
    </form>
  );
}
