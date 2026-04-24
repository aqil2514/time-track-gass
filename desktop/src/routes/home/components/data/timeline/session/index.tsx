import { format } from "date-fns";
import { SessionActivityItem } from "./session-activity-item";
import { useHomeContext } from "@/routes/home/store/home.provider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingSpinner } from "@/components/atoms/loading-spinner"; // Pastikan path benar
import { AlertCircle } from "lucide-react";

export function SessionTimeline() {
  const {
    fetcher: { data, isLoading, error },
  } = useHomeContext();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <LoadingSpinner />
        <p className="text-xs text-slate-500 animate-pulse font-medium">
          Memuat timeline sesi...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-2 text-red-400">
        <AlertCircle className="w-8 h-8 opacity-50" />
        <p className="text-sm font-medium">Gagal memuat data</p>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">
          {error.message || "Terjadi kesalahan server"}
        </p>
      </div>
    );
  }

  if (!data?.workSessions || data.workSessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-500 text-xs italic">
        Belum ada riwayat sesi hari ini.
      </div>
    );
  }

  const sortedSessions = [...data.workSessions].sort(
    (a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime()
  );

  return (
    <ScrollArea className="h-screen pr-4">
      <div className="py-6 px-2">
        {sortedSessions.map((session, index) => {
          // Urutkan report di dalam sesi: Terbaru paling atas
          const sortedReports = [...session.reports].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          return (
            <div key={session.id} className="mb-12 last:mb-0">
              {/* Label Sesi */}
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

              {/* List Aktivitas Raw */}
              <div className="max-w-2xl mx-auto">
                {sortedReports.length > 0 ? (
                  sortedReports.map((report) => (
                    <SessionActivityItem 
                      key={report.id} 
                      activity={report} 
                    />
                  ))
                ) : (
                  <div className="text-center py-10 border-2 border-dashed border-slate-900 rounded-3xl">
                    <p className="text-xs text-slate-600 font-medium italic">
                      Menunggu screenshot pertama masuk...
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}