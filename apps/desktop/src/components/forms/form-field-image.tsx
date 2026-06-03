/* eslint-disable @next/next/no-img-element */
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";
import {
  useRef,
  ClipboardEvent,
  useEffect,
  ChangeEvent,
  useMemo,
  useState,
} from "react";
import {
  Controller,
  FieldValues,
  Path,
  PathValue,
  useWatch,
} from "react-hook-form";
import { labelTextMapper } from "./form-constants";
import { BasicFormFieldProps } from "./form.interface";
import { Trash2, Upload } from "lucide-react"; // Menggunakan Lucide

export function FormFieldImage<T extends FieldValues>({
  form,
  name,
  label,
  placeholder = "Klik untuk upload atau paste gambar langsung...",
  className,
  textVariant = "default",
  maxSizeInMB = 5,
  existingImageUrl,
  onExistingImageRemove,
}: BasicFormFieldProps<T> & {
  maxSizeInMB?: number;
  existingImageUrl?: string;
  onExistingImageRemove?: () => void;
}) {
  const isSubmitting = form.formState.isSubmitting;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileValue = useWatch({
    control: form.control,
    name: name as Path<T>,
  });
  const [isExistingRemoved, setIsExistingRemoved] = useState(false);

  const previewUrl = useMemo(() => {
    const isObject = fileValue !== null && typeof fileValue === "object";

    if (isObject) {
      const potentialFile = fileValue as object;
      if (potentialFile instanceof Blob || potentialFile instanceof File) {
        return URL.createObjectURL(potentialFile);
      }
    }

    if (existingImageUrl && !isExistingRemoved) return existingImageUrl;

    return null;
  }, [fileValue, existingImageUrl, isExistingRemoved]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <FieldGroup>
      <Controller
        name={name}
        control={form.control}
        render={({ field: { onChange }, fieldState }) => {
          const processFile = (file: File) => {
            if (file.size > maxSizeInMB * 1024 * 1024) {
              form.setError(name as Path<T>, {
                type: "validate",
                message: `Ukuran maksimal ${maxSizeInMB}MB`,
              });
              return;
            }
            onChange(file as PathValue<T, Path<T>>);
            form.clearErrors(name as Path<T>);
          };

          const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
            if (isSubmitting) return;
            const items = event.clipboardData.items;
            for (const item of items) {
              if (item.type.indexOf("image") !== -1) {
                const file = item.getAsFile();
                if (file) processFile(file);
                event.preventDefault();
                break;
              }
            }
          };

          const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file) processFile(file);
            event.target.value = ""; // Clear input so same file can be re-selected
          };

          return (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className={labelTextMapper[textVariant]}>
                {label}
              </FieldLabel>

              <div className="relative group">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />

                <div
                  contentEditable={!isSubmitting && !previewUrl}
                  suppressContentEditableWarning={true}
                  onPaste={handlePaste}
                  onClick={() => !previewUrl && fileInputRef.current?.click()}
                  className={cn(
                    "bg-slate-800/60 border-2 border-dashed border-slate-700 text-white rounded-lg transition-all",
                    "min-h-37.5 flex flex-col items-center justify-center p-4 text-center relative",
                    !previewUrl &&
                      "cursor-pointer hover:border-amber-500/50 hover:bg-slate-800/80",
                    isSubmitting &&
                      "opacity-60 cursor-not-allowed text-transparent",
                    fieldState.invalid && "border-rose-500",
                    className,
                  )}
                >
                  {previewUrl ? (
                    <div className="relative w-full flex justify-center">
                      <img
                        src={previewUrl}
                        className="max-h-64 rounded-md object-contain border border-slate-700 shadow-xl"
                        alt="Preview"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChange(null);
                          setIsExistingRemoved(true);
                          onExistingImageRemove?.();
                        }}
                        className="absolute -top-3 -right-3 bg-rose-600 hover:bg-rose-500 p-1.5 rounded-full shadow-lg transition-colors text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400 pointer-events-none">
                      <Upload className="h-8 w-8 mb-2" />
                      <p className="text-sm font-medium">
                        <span className="text-amber-500">
                          Klik untuk upload
                        </span>{" "}
                        atau paste gambar
                      </p>
                      <p className="text-xs opacity-60 italic mt-1">
                        &quot;{placeholder}&quot;
                      </p>
                      <p className="text-xs opacity-60">Max {maxSizeInMB}MB</p>
                    </div>
                  )}
                </div>
              </div>

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          );
        }}
      />
    </FieldGroup>
  );
}
