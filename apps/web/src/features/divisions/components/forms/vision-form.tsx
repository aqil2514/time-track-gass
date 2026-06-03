import { useFieldArray, UseFormReturn, useWatch } from "react-hook-form";
import { DivisionSchemaType } from "../../schemas/division.schema";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { FormFieldText } from "@/components/forms/form-field-text";
import { FormFieldTextArea } from "@/components/forms/form-field-textarea";

interface Props {
  form: UseFormReturn<DivisionSchemaType>;
}

export function VisionForm({ form }: Props) {
  const { append, fields, remove } = useFieldArray({
    control: form.control,
    name: "vision_config.allowed_categories" as never,
  });

  const watchedCategories = useWatch({
    control: form.control,
    name: "vision_config.allowed_categories",
  });

  useEffect(() => {
    const currentDefinitions = form.getValues(
      "vision_config.category_definitions",
    );
    const newDefinitions = { ...currentDefinitions };
    let hasChanged = false;

    watchedCategories.forEach((cat) => {
      if (cat && !(cat in newDefinitions)) {
        newDefinitions[cat] = "";
        hasChanged = true;
      }
    });

    Object.keys(newDefinitions).forEach((key) => {
      if (!watchedCategories.includes(key)) {
        delete newDefinitions[key];
        hasChanged = true;
      }
    });

    if (hasChanged) {
      form.setValue("vision_config.category_definitions", newDefinitions, {
        shouldValidate: true,
      });
    }
  }, [watchedCategories, form]);

  return (
    <div className="space-y-4 p-5 bg-slate-900/40 rounded-xl border border-slate-800/60 shadow-inner">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-bold text-amber-500 uppercase tracking-widest">
          Konfigurasi Kategori
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append("")}
          className="h-8 border-amber-500/50 text-amber-500 hover:bg-amber-500/10 bg-transparent text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Tambah Kategori
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => {
          const categoryName = watchedCategories[index];

          return (
            <div
              key={field.id}
              className="p-4 border border-slate-700/50 rounded-lg bg-slate-800/30 space-y-4 transition-all"
            >
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <FormFieldText
                    form={form}
                    name={`vision_config.allowed_categories.${index}`}
                    label={`Kategori #${index + 1}`}
                    placeholder="e.g. active_support"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  className="mt-8 text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {categoryName && categoryName.trim() !== "" && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <FormFieldTextArea
                    form={form}
                    name={`vision_config.category_definitions.${categoryName}`}
                    label={`Definisi ${categoryName}`}
                    placeholder={`Apa yang dilakukan pada kategori ${categoryName}?`}
                    rows={2}
                  />
                </div>
              )}
            </div>
          );
        })}

        {fields.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-slate-800/50 rounded-lg text-slate-600">
            <p className="text-xs">
              Belum ada konfigurasi kategori untuk AI Vision.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
