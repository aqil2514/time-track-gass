"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MultiDayMatrixResponse } from "@/features/matrix/types/matrix.types";
import { useMatrixRangeContext } from "@/features/matrix/provider/matrix-range.provider";
import { useQueryParams } from "@/hooks/use-query-params";
import { useUsername } from "@/hooks/resources/use-username";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { MultiDayBox } from "./multi-day-box";

function getMonthLabels(dates: string[]): { label: string; span: number }[] {
  const labels: { label: string; span: number }[] = [];
  let currentMonth = "";
  let span = 0;

  for (const date of dates) {
    const month = format(parseISO(date), "MMM yyyy", { locale: id });
    if (month === currentMonth) {
      span++;
      labels[labels.length - 1].span = span;
    } else {
      currentMonth = month;
      span = 1;
      labels.push({ label: month, span: 1 });
    }
  }

  return labels;
}

function getMaxActivity(data: MultiDayMatrixResponse[]): number {
  let max = 0;
  for (const user of data) {
    for (const entry of user.dailyActivity) {
      if (entry.totalActivity > max) max = entry.totalActivity;
    }
  }
  return max;
}

export function MultiDayGrid() {
  const { data, isLoading } = useMatrixRangeContext();
  const { data: users } = useUsername();
  const { get } = useQueryParams();

  const from = get("from");
  const to = get("to");
  const selectedDivision = get("division");

  if (isLoading) {
    return <div className="p-6 text-slate-500 animate-pulse">Memuat data matriks...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="p-6 text-slate-500">Tidak ada data aktivitas untuk rentang ini.</div>;
  }

  const allDates = eachDayOfInterval({
    start: parseISO(from!),
    end: parseISO(to!),
  }).map((d) => format(d, "yyyy-MM-dd"));

  const monthLabels = getMonthLabels(allDates);
  const maxActivity = getMaxActivity(data);

  const filteredData = selectedDivision
    ? data.filter((user) => {
        const profile = users.find((p) => p.id === user.userId);
        return profile?.division === selectedDivision;
      })
    : data;

  const cellWidth = 20;
  const gridWidth = allDates.length * cellWidth;

  return (
    <div className="p-6 bg-[#020817] text-slate-400 text-[11px] font-sans">
      <Card className="bg-[#020817]/50 border-slate-800/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex">
            {/* Kolom kiri: label user (sticky) */}
            <div className="w-52 shrink-0">
              {/* Spacer untuk header bulan */}
              <div className="h-6 mb-2" />
              <div className="space-y-4">
                {filteredData.map((user) => {
                  const totalActivity = user.dailyActivity.reduce((sum, e) => sum + e.totalActivity, 0);
                  const totalMinutes = user.dailyActivity.reduce((sum, e) => sum + e.totalMinutes, 0);
                  return (
                    <div key={user.userId} className="h-9 flex flex-col justify-center border-r border-slate-800/60 pr-4 group">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-100 font-bold truncate uppercase tracking-widest text-[11px] group-hover:text-purple-400 transition-colors">
                          {user.userName}
                        </span>
                        <span className="text-[9px] text-purple-400/70 font-medium truncate normal-case tracking-normal shrink-0">
                          {user.division}
                        </span>
                      </div>
                      <p className="text-[10px] truncate">
                        <span className="text-emerald-400 font-semibold">{totalActivity}</span>
                        <span className="text-slate-600"> laporan · </span>
                        <span className="text-sky-400 font-semibold">{totalMinutes}</span>
                        <span className="text-slate-600"> mnt</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Kolom kanan: scroll bersama */}
            <div className="flex-1 overflow-x-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#334155 #0f172a" }}>
              {/* Header bulan */}
              <div className="flex h-6 mb-2" style={{ minWidth: `${gridWidth}px` }}>
                {monthLabels.map((m, i) => (
                  <div
                    key={i}
                    className="text-[10px] text-slate-500 font-bold uppercase tracking-wider"
                    style={{ width: `${(m.span / allDates.length) * 100}%` }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>

              {/* Baris per user */}
              <div className="space-y-4" style={{ minWidth: `${gridWidth}px` }}>
                {filteredData.map((user) => {
                  const activityMap = new Map(
                    user.dailyActivity.map((e) => [e.date, e]),
                  );

                  return (
                    <div key={user.userId} className="flex gap-0.5">
                      {allDates.map((date) => {
                        const entry = activityMap.get(date) ?? {
                          date,
                          totalActivity: 0,
                          totalMinutes: 0,
                        };
                        return (
                          <div key={date} style={{ width: `${cellWidth}px`, flexShrink: 0 }}>
                            <MultiDayBox
                              user={user}
                              entry={entry}
                              maxActivity={maxActivity}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
