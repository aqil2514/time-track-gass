import { AttendanceSummaryTemplate } from "@/features/attendance/attendance.template";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ringkasan Absensi",
};

export default function AttendanceSummaryPage() {
  return <AttendanceSummaryTemplate />;
}
