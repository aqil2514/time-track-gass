import z from "zod";
import { adjustmentSchema } from "./attendance-logs-adjustment.schema";

export const editAdjustmentSchema = z.object({
  ...adjustmentSchema.shape,
  date: z.string().min(1, "Tanggal harus diisi"),
});

export type EditAdjustmentType = z.infer<
  typeof editAdjustmentSchema
>;