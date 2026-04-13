import z from "zod";

const optionalCurrencySchema = z
  .string()
  .optional()
  .transform((val) => {
    if (!val) return undefined;
    return Number(val.replace(/[^0-9]/g, ""));
  });

export const userManagementSchema = z
  .object({
    userId: z.string(),
    weeklyHour: z
      .number({ message: "Jam mingguan wajib diisi" })
      .min(1, "Jam mingguan minimal 1 jam"),
    monthlyHour: z
      .number({ message: "Jam bulanan wajib diisi" })
      .min(1, "Jam bulanan minimal 1 jam"),
    penaltyType: z.string().min(1, "Tipe penalti wajib dipilih"),
    hourlyPenalty: optionalCurrencySchema,
    hourlyBonus: optionalCurrencySchema,
  })
  .superRefine((data, ctx) => {
    if (data.penaltyType === "fee" && !data.hourlyPenalty)
      ctx.addIssue({
        code: "custom",
        path: ["hourlyPenalty"],
        message: "Nominal penalti per jam wajib diisi",
      });
  });

export type UserManagementInput = z.input<typeof userManagementSchema>;
export type UserManagementOutput = z.output<typeof userManagementSchema>;

export const defaultUserManagement: UserManagementInput = {
  userId:"",
  hourlyBonus: "",
  hourlyPenalty: "",
  monthlyHour: 140,
  penaltyType: "fee",
  weeklyHour: 35,
};
