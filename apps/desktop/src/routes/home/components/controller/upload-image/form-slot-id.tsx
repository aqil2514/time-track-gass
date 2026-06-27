import { FormFieldImage } from "@/components/forms/form-field-image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { UploadImageInput } from "@/routes/home/schema/upload-image.schema";
import { AlertCircle, FolderOpen } from "lucide-react";
import { useRef } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { ErrorDataMap } from ".";

interface Props {
  form: UseFormReturn<UploadImageInput>;
  errorData: ErrorDataMap[];
}

export function FormSlotId({ form, errorData }: Props) {
  const bulkInputRef = useRef<HTMLInputElement>(null);

  const imagesWatcher = useWatch({
    control: form.control,
    name: "images",
  });

  const getFileError = (index: number) => {
    const fileAtRef = imagesWatcher[index];
    if (!(fileAtRef instanceof File)) return null;

    return errorData?.find((err) => err.filename === fileAtRef.name);
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    e.target.value = "";

    const current = [...(imagesWatcher ?? [])];
    let fileIdx = 0;

    for (let slot = 0; slot < 8 && fileIdx < files.length; slot++) {
      if (!(current[slot] instanceof File)) {
        current[slot] = files[fileIdx++];
      }
    }

    form.setValue("images", current, { shouldValidate: true });
  };

  return (
    <ScrollArea className="flex-1 min-h-0 pr-4">
      <div className="flex justify-end mb-3">
        <input
          ref={bulkInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleBulkUpload}
        />
        <button
          type="button"
          onClick={() => bulkInputRef.current?.click()}
          className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          Upload Semua Sekaligus
        </button>
      </div>
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
  );
}
