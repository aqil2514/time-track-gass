import z from "zod";

const adjumentSchema = z.object({
  id: z.string(),
  adjusment_name: z.string().optional(),
  added_minutes: z.number(),
});

export const attendanceLogsAdjustmentSchema = z.object({
  adjustment: z.array(adjumentSchema),
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
