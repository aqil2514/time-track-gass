import z from "zod";

const adjumentSchema = z.object({
  id: z.number(),
  adjusment_name: z.string().optional(),
  adjusment_description: z.string().optional(),
  added_minutes: z.number(),
});

export const attendanceLogsAdjustmentSchema = z.object({
  adjustment: z.array(adjumentSchema),
  profile_id: z.array(z.string()),
  date: z.string(),
});

export type AttendanceLogsAdjustmentType = z.infer<
  typeof attendanceLogsAdjustmentSchema
>;

export const defaultAttendanceLogsAdjustment: AttendanceLogsAdjustmentType = {
  profile_id: [],
  adjustment: [],
  date: "",
};
