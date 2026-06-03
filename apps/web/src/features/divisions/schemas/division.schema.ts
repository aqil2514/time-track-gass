import z from "zod";

const visionConfigSchema = z
  .object({
    allowed_categories: z
      .array(z.string())
      .min(1, "Minimal pilih satu kategori"),
    category_definitions: z.record(z.string(), z.string()),
  })
  .refine(
    (data) => {
      const { allowed_categories, category_definitions } = data;
      const definitionKeys = Object.keys(category_definitions);

      if (allowed_categories.length !== definitionKeys.length) return false;

      return allowed_categories.every((cat) => cat in category_definitions);
    },
    {
      message:
        "Setiap kategori yang dipilih wajib memiliki definisi yang sesuai.",
      path: ["category_definitions"],
    },
  );

export const divisionSchema = z.object({
  name: z.string().min(1, "Nama divisi wajib diisi"),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  vision_config: visionConfigSchema,
});

export type DivisionSchemaType = z.infer<typeof divisionSchema>;

export const divisionSchemaDefault: DivisionSchemaType = {
  description: "",
  name: "",
  vision_config: {
    allowed_categories: [],
    category_definitions: {},
  },
};
