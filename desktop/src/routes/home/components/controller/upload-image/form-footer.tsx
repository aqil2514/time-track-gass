import { PrimaryButton } from "@/components/atoms/primary-button";
import { UploadImageInput } from "@/routes/home/schema/upload-image.schema";
import { AlertCircle } from "lucide-react";
import { UseFormReturn, useWatch } from "react-hook-form";

interface Props {
  form: UseFormReturn<UploadImageInput>;
}

export function FormFooter({ form }: Props) {
  const imagesWatcher = useWatch({
    control: form.control,
    name: "images",
  });
  const uploadedCount = imagesWatcher.filter(
    (img) => img instanceof File,
  ).length;
  const isMinReached = uploadedCount >= 8;

  const { errors, isSubmitting } = form.formState;
  return (
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
  );
}
