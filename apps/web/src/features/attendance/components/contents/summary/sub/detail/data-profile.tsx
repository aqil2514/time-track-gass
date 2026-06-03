import { UserAttendanceDetail } from "@/features/attendance/interfaces/attendace-logs.interface";

interface Props {
  data: UserAttendanceDetail;
}

export function DetailDialogDataProfile({ data }: Props) {
  return (
    <div className="flex justify-between items-center p-5 rounded-xl bg-slate-800/40 border border-slate-700/50">
      <div>
        <h3 className="text-xl font-bold text-white">
          {data.profile.full_name}
        </h3>
        <p className="text-sm text-slate-400">
          {data.profile.email} • {data.profile.division}
        </p>
      </div>
      <div className="px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-700 text-xs font-mono text-slate-300">
        ID: {data.profile.username}
      </div>
    </div>
  );
}
