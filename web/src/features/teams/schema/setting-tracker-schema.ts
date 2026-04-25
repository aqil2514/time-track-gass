import z from "zod";

export const settingTrackerSchema = z.object({
  allowedMode: z.string().array().min(1),
});

export type settingTrackerSchemaType = z.infer<typeof settingTrackerSchema>;
