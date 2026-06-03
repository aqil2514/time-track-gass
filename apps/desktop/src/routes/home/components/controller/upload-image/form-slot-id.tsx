import { FormFieldImage } from "@/components/forms/form-field-image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { UploadImageInput } from "@/routes/home/schema/upload-image.schema";
import { AlertCircle } from "lucide-react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { ErrorDataMap } from ".";

interface Props {
  form: UseFormReturn<UploadImageInput>;
  errorData: ErrorDataMap[];
}

export function FormSlotId({ form, errorData }: Props) {
  const imagesWatcher = useWatch({
    control: form.control,
    name: "images",
  });
  const getFileError = (index: number) => {
    const fileAtRef = imagesWatcher[index];
    if (!(fileAtRef instanceof File)) return null;

    return errorData?.find((err) => err.filename === fileAtRef.name);
  };
  return (
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
