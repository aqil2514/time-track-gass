import { timeToMinutesSchema } from "@/components/forms/form-field-time-picker";
import z from "zod";

export const listSchema = z.object({
  name: z.string().min(3, "Nama kategori minimal 3 karakter"),
  added_minutes: timeToMinutesSchema,
  notes: z.string().min(5, "Deskripsi minimal 5 karakter"),
});

export type ListSchemaType = z.output<typeof listSchema>;
export type ListSchemaInput = z.input<typeof listSchema>;

export const defaultListSchema: ListSchemaInput = {
  added_minutes: "01:30", 
  name: "",
  notes: "",
};