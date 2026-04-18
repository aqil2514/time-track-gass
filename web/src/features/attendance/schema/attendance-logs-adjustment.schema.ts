import z from "zod";

export const adjustmentSchema = z
  .object({
    id: z.string(),
    adjusment_name: z.string().optional(),
    image: z.instanceof(File).nullable(),
    added_minutes: z.number(),
  })
  .superRefine((value, ctx) => {
    if (value.id === "-1" && !value.adjusment_name)
      return ctx.addIssue({
        code: "custom",
        message: "Nama Penyesuaian wajib diisi",
        path: ["adjusment_name"],
      });
  });

export const attendanceLogsAdjustmentSchema = z.object({
  adjustment: z.array(adjustmentSchema).min(1, "Pilih minimal 1 penyesuaian"),
  profile_id: z.array(z.string()).min(1, "Pilih minimal satu karyawan"),

  date: z.string().min(1, "Tanggal harus diisi"),
});

export type AttendanceLogsAdjustmentType = z.infer<
  typeof attendanceLogsAdjustmentSchema
>;

export const defaultAttendanceLogsAdjustment: AttendanceLogsAdjustmentType = {
  profile_id: [],
  adjustment: [],
  date: "",
};
