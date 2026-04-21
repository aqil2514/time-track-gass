import {
  defaultUploadImages,
  UploadImageInput,
  uploadImageSchema,
} from "@/routes/home/schema/upload-image.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FormFieldImage } from "@/components/forms/form-field-image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PrimaryButton } from "@/components/atoms/primary-button";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface Props {
  defaultValues?: UploadImageInput;
  onSubmit: (values: UploadImageInput) => Promise<void> | void;
  selectedSlot: number | null;
}

export function UploadImageForm({
  onSubmit,
  defaultValues,
  selectedSlot,
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
      <ScrollArea className="flex-1 min-h-0 pr-4">
        <div className="grid grid-cols-2 gap-4 pb-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <FormFieldImage
              key={index}
              form={form}
              name={`images.${index}`}
              label={`Screenshot ${index + 1}`}
              placeholder="Paste SS Taskbar di sini"
              className="min-h-45"
            />
          ))}
        </div>
      </ScrollArea>

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
