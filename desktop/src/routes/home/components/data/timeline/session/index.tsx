import { format } from "date-fns";
import { SessionActivityItem } from "./session-activity-item";
import { useHomeContext } from "@/routes/home/store/home.provider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingSpinner } from "@/components/atoms/loading-spinner"; // Pastikan path benar
import { AlertCircle } from "lucide-react";
import React from "react";
import {
  WorkSessionItem,
  WorkSessionReport,
} from "@/routes/home/types/work-session.type";

const IsLoading = () => {
  return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <LoadingSpinner />
      <p className="text-xs text-slate-500 animate-pulse font-medium">
        Memuat timeline sesi...
      </p>
    </div>
  );
};

const Error: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center h-96 gap-2 text-red-400">
      <AlertCircle className="w-8 h-8 opacity-50" />
      <p className="text-sm font-medium">Gagal memuat data</p>
      <p className="text-[10px] text-slate-500 uppercase tracking-widest">
        {message || "Terjadi kesalahan server"}
      </p>
    </div>
  );
};

const NoHistory = () => {
  return (
    <div className="flex items-center justify-center h-96 text-slate-500 text-xs italic">
      Belum ada riwayat sesi hari ini.
    </div>
  );
};

const LabelSession: React.FC<{
  sortedSessions: WorkSessionItem[];
  index: number;
  session: WorkSessionItem;
}> = ({ index, session, sortedSessions }) => {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="h-px flex-1 bg-linear-to-r from-transparent via-slate-800 to-transparent" />
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em]">
          Sesi Ke-#{sortedSessions.length - index}
        </span>
        <span className="text-[10px] text-slate-500 font-medium">
          {format(new Date(session.start_at), "PPP")}
        </span>
      </div>
      <div className="h-px flex-1 bg-linear-to-r from-transparent via-slate-800 to-transparent" />
    </div>
  );
};

const SessionList: React.FC<{
  sortedReports: WorkSessionReport[];
  session: WorkSessionItem;
}> = ({ sortedReports, session }) => {
  const isNoActivity = session.end_at !== null && sortedReports.length === 0;

  if (sortedReports.length > 0) {
    return sortedReports.map((report) => (
      <SessionActivityItem key={report.id} activity={report} />
    ));
  }

  if (isNoActivity) {
    return (
      <div className="text-center py-10 border-2 border-dashed border-slate-900 rounded-3xl bg-slate-950/20">
        <p className="text-xs text-slate-500 font-medium italic">
          Tidak ada aktivitas yang terekam pada sesi ini.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-10 border-2 border-dashed border-slate-900 rounded-3xl">
      <p className="text-xs text-slate-600 font-medium italic animate-pulse">
        Menunggu screenshot pertama masuk...
      </p>
    </div>
  );
};

export function SessionTimeline() {
  const {
    fetcher: { data, isLoading, error },
  } = useHomeContext();

  if (isLoading) return <IsLoading />;

  if (error) return <Error message={error?.message} />;

  if (!data?.workSessions || data.workSessions.length === 0)
    return <NoHistory />;

  const sortedSessions = [...data.workSessions].sort(
    (a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime(),
  );

  return (
    <ScrollArea className="h-screen pr-4">
      <div className="py-6 px-2">
        {sortedSessions.map((session, index) => {
          // Urutkan report di dalam sesi: Terbaru paling atas
          const sortedReports = [...session.reports].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );

          return (
            <div key={session.id} className="mb-12 last:mb-0">
              <LabelSession
                index={index}
                session={session}
                sortedSessions={sortedSessions}
              />

              {/* List Aktivitas Raw */}
              <div className="max-w-2xl mx-auto">
                <SessionList sortedReports={sortedReports} session={session} />
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
