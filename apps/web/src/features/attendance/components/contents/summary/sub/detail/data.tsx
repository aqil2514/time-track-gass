import { UserAttendanceDetail } from "@/features/attendance/interfaces/attendace-logs.interface";
import { DetailDialogDataProfile } from "./data-profile";
import { DetailDialogNotes } from "./data-notes";
import { DetailDialogChart } from "./data-chart";

interface Props {
  data: UserAttendanceDetail | undefined;
}

export function DetailDialogData({ data }: Props) {
  if (!data) return null;

  return (
    <div className="space-y-6 py-2">
      <DetailDialogDataProfile data={data} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <DetailDialogChart data={data} />

        <DetailDialogNotes data={data} />
      </div>
    </div>
  );
}
