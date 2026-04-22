import { z } from "zod";

export const uploadImageSchema = z
  .object({
    slotId: z.number().min(0).max(23).nullable(),
    currentTime: z.number(),
    images: z
      .array(z.instanceof(File).nullable())
      .refine((arr) => arr.filter((img) => img instanceof File).length >= 8, {
        message: "Minimal harus mengunggah 8 gambar per jam.",
      }),
  })
  .refine((data) => data.slotId && data.slotId < data.currentTime, {
    message: "Slot ini belum tersedia untuk diunggah.",
    path: ["slotId"],
  });

export type UploadImageInput = z.infer<typeof uploadImageSchema>;

export const defaultUploadImages: UploadImageInput = {
  currentTime: new Date().getHours(),
  images: [],
  slotId: null,
};
