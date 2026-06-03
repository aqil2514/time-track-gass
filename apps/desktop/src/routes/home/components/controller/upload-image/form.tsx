import {
  defaultUploadImages,
  UploadImageInput,
  uploadImageSchema,
} from "@/routes/home/schema/upload-image.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm} from "react-hook-form";
import { useEffect } from "react";
import { ErrorDataMap } from ".";
import { FormHeaderInfo } from "./form-header-info";
import { FormSlotId } from "./form-slot-id";
import { FormFooter } from "./form-footer";

export interface UploadImageFormProps {
  onSubmit: (values: UploadImageInput) => Promise<void> | void;
  selectedSlot: number | null;
  errorData: ErrorDataMap[];
  setErrorData: React.Dispatch<React.SetStateAction<ErrorDataMap[]>>;
}

export function UploadImageForm({
  onSubmit,
  selectedSlot,
  errorData,
  setErrorData,
}: UploadImageFormProps) {
  const form = useForm<UploadImageInput>({
    defaultValues: defaultUploadImages,
    resolver: zodResolver(uploadImageSchema),
    mode: "onChange",
  });

  useEffect(() => {
    setErrorData([]);
    if (selectedSlot === null) return;

    form.reset({
      ...defaultUploadImages,
      slotId: selectedSlot,
      images: [],
    });
  }, [selectedSlot, form]);

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, (error) => console.error(error))}
      className="flex flex-col h-full min-h-0 space-y-4"
    >
      <FormHeaderInfo form={form} />

      <FormSlotId errorData={errorData} form={form} />

      {/* Footer Action */}
      <FormFooter form={form} />
    </form>
  );
}
