import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAttendanceDetail } from "@/features/attendance/interfaces/attendace-logs.interface";
import { useSummaryAttendance } from "@/features/attendance/provider/summary.provider";
import { useFetch } from "@/hooks/use-fetch";
import { useQueryParams } from "@/hooks/use-query-params";
import { buildUrl } from "@/utils/build-url";
import { webUrl } from "@/constants/server-url";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { ControlledDialogContainer } from "@/components/containers/controlled-dialog-container";
import { formatToTime } from "@/utils/format-to-time";

export function DetailDialog() {
  const { get, update } = useQueryParams();
  const { query } = useSummaryAttendance();
  const open = get("action") === "detail";
  const userId = get("userId");

  const url = useMemo<string | null>(() => {
    if (!userId) return null;
    return buildUrl(`/api/attendance/summary/${userId}`, webUrl, query);
  }, [query, userId]);

  const { data, isLoading } = useFetch<UserAttendanceDetail>(url);

  return (
    <ControlledDialogContainer
      title="Detail Ringkasan"
      description="Informasi detail kehadiran dan penyesuaian waktu"
      open={open}
      onOpenChange={(o) => !o && update({ userId: null, action: null })}
      className="sm:max-w-7xl bg-[#0f1021] text-slate-200 border-slate-800"
    >
      {isLoading ? (
        <div className="space-y-6 p-4">
          <Skeleton className="h-20 w-full bg-slate-800" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-64 bg-slate-800" />
            <Skeleton className="h-64 bg-slate-800" />
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6 py-2">
          {/* Profile Header - Matching your ID Badge style */}
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart Section */}
            <div className="lg:col-span-7 p-5 rounded-xl bg-slate-800/20 border border-slate-800/60">
              <h4 className="text-sm font-semibold mb-6 text-slate-300">
                Riwayat Jam Kerja
              </h4>
              <div className="h-70 w-full">
                <ResponsiveContainer width="100%" height="100%" aspect={2}>
                  <BarChart
                    data={data.workHourHistory}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#2e334e"
                      opacity={0.5}
                    />
                    <XAxis
                      dataKey="work_date"
                      tickFormatter={(str) =>
                        format(new Date(str), "dd MMM", { locale: id })
                      }
                      fontSize={11}
                      tick={{ fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      fontSize={11}
                      tick={{ fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `${Math.round(value / 60)}j`}
                    />
                    <Tooltip
                      cursor={{ fill: "#ffffff0a" }}
                      contentStyle={{
                        backgroundColor: "#1a1b2e",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                      }}
                      itemStyle={{ color: "#fff" }}
                      labelStyle={{ color: "#94a3b8", marginBottom: "4px" }}
                      labelFormatter={(label) =>
                        format(new Date(label), "EEEE, dd MMMM", { locale: id })
                      }
                      formatter={(value) => [
                        formatToTime(Number(value), "minutes"),
                        "Durasi",
                      ]}
                    />
                    <Bar
                      dataKey="duration_minutes"
                      radius={[4, 4, 0, 0]}
                      barSize={40}
                    >
                      {data.workHourHistory.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.duration_minutes > 450 ? "#818cf8" : "#475569"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Notes Section */}
            <div className="lg:col-span-5 p-5 rounded-xl bg-slate-800/20 border border-slate-800/60 flex flex-col">
              <h4 className="text-sm font-semibold mb-4 text-slate-300">
                Catatan Penambahan
              </h4>
              <div className="overflow-hidden rounded-lg border border-slate-800">
                <Table>
                  <TableHeader className="bg-slate-800/50">
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-[11px] uppercase tracking-wider text-slate-500">
                        Tanggal
                      </TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider text-slate-500">
                        Keterangan
                      </TableHead>
                      <TableHead className="text-right text-[11px] uppercase tracking-wider text-slate-500">
                        Min
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.listNotes.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center py-10 text-slate-500 text-xs"
                        >
                          Tidak ada penambahan
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.listNotes.map((note) => (
                        <TableRow
                          key={note.id}
                          className="border-slate-800 hover:bg-slate-800/30"
                        >
                          <TableCell className="text-[11px] text-slate-400 font-medium">
                            {format(new Date(note.date), "dd/MM/yy")}
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="text-[13px] font-medium text-slate-200">
                              {note.adjustment.name}
                            </div>
                            <div className="text-[11px] text-slate-500 line-clamp-1">
                              {note.adjustment.notes}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-xs font-bold text-emerald-400">
                            +{note.affected_minutes}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </ControlledDialogContainer>
  );
}
