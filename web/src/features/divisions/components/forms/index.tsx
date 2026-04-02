import { useForm } from "react-hook-form";
import {
  divisionSchema,
  divisionSchemaDefault,
  DivisionSchemaType,
} from "../../schemas/division.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormFieldText } from "@/components/forms/form-field-text";
import { FormFieldTextArea } from "@/components/forms/form-field-textarea";
import { VisionForm } from "./vision-form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react"; 
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  defaultValues?: DivisionSchemaType;
  submitHandler: (values: DivisionSchemaType) => Promise<void> | void;
  onCancelButton: () => void
}


export function DivisionForm({ submitHandler, defaultValues, onCancelButton }: Props) {
  const form = useForm<DivisionSchemaType>({
    defaultValues: defaultValues ?? divisionSchemaDefault,
    resolver: zodResolver(divisionSchema),
  });

  const isSubmitting = form.formState.isSubmitting;

  return (
    <form onSubmit={form.handleSubmit(submitHandler)}>
      <ScrollArea className="h-96 px-4">
        <div className="space-y-6 ">
          <div className="space-y-4">
            <FormFieldText
              form={form}
              label="Nama Divisi"
              name="name"
              placeholder="Finance"
            />
            <FormFieldTextArea
              form={form}
              label="Deskripsi Divisi"
              name="description"
              placeholder="Divisi ini untuk mengurus keuangan..."
            />
          </div>

          <VisionForm form={form} />
        </div>
      </ScrollArea>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
        <Button
          type="button"
          variant="ghost"
          disabled={isSubmitting}
          onClick={onCancelButton}
          className="text-slate-400"
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-amber-600 hover:bg-amber-700 text-white min-w-30"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            "Simpan Divisi"
          )}
        </Button>
      </div>
    </form>
  );
}
