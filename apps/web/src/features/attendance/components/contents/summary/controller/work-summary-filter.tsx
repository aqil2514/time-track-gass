"use client";

import { LabelValue } from "@/@types/general";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar, Layers } from "lucide-react";
import { useQueryParams } from "@/hooks/use-query-params";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  addWeeks,
  format,
} from "date-fns";

const monthOptions: LabelValue[] = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

function getYearOptions(rangeBack: number = 3): LabelValue[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: rangeBack }, (_, i) => {
    const year = currentYear - i;
    return { value: String(year), label: String(year) };
  });
}

interface WeekOption {
  value: string; // tanggal Senin (yyyy-MM-dd)
  label: string; // "Minggu ke-N (DD Mon – DD Mon)"
}

function getWeeksInMonth(year: number, month: number): WeekOption[] {
  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(monthStart);

  const weeks: WeekOption[] = [];
  let weekStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  let weekIndex = 1;

  while (weekStart <= monthEnd) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const label = `Minggu ke-${weekIndex} (${format(weekStart, "d MMM")} – ${format(weekEnd, "d MMM")})`;
    weeks.push({
      value: format(weekStart, "yyyy-MM-dd"),
      label,
    });

    weekStart = addWeeks(weekStart, 1);
    weekIndex++;
  }

  return weeks;
}

export function WorkSummaryFilter() {
  const { get, update, set } = useQueryParams();

  const mode = get("mode") ?? "weekly";
  const month = get("month");
  const year = get("year");
  const weeklyYear = get("weeklyYear");
  const weeklyMonth = get("weeklyMonth");

  const yearOptions = getYearOptions(3);
  const weekOptions =
    weeklyYear && weeklyMonth
      ? getWeeksInMonth(Number(weeklyYear), Number(weeklyMonth))
      : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800 w-fit">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            update({
              mode: "weekly",
              month: null,
              year: null,
              date: null,
              weeklyYear: null,
              weeklyMonth: null,
            });
          }}
          className={cn(
            "h-9 px-4 rounded-lg transition-all text-xs font-medium",
            mode === "weekly"
              ? "bg-purple-500 text-white shadow-lg hover:bg-purple-600 hover:text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800",
          )}
        >
          <Calendar className="w-3.5 h-3.5 mr-2" />
          Mingguan
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            update({ mode: "monthly", date: null, month: null, year: null, weeklyYear: null, weeklyMonth: null });
          }}
          className={cn(
            "h-9 px-4 rounded-lg transition-all text-xs font-medium",
            mode === "monthly"
              ? "bg-purple-500 text-white shadow-lg hover:bg-purple-600 hover:text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800",
          )}
        >
          <Layers className="w-3.5 h-3.5 mr-2" />
          Bulanan
        </Button>
      </div>

      <div className="flex items-center gap-4 animate-in fade-in duration-300">
        {mode === "weekly" ? (
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                Tahun
              </span>
              <div className="w-24">
                <Select
                  value={weeklyYear ?? ""}
                  onValueChange={(value) =>
                    update({ weeklyYear: value, weeklyMonth: null, date: null })
                  }
                >
                  <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white focus:border-purple-500 focus:ring-purple-500/20 h-11 rounded-lg transition-all">
                    <SelectValue placeholder="Tahun" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    {yearOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="focus:bg-purple-500 focus:text-white transition-colors cursor-pointer"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                Bulan
              </span>
              <div className="w-32">
                <Select
                  value={weeklyMonth ?? ""}
                  onValueChange={(value) =>
                    update({ weeklyMonth: value, date: null })
                  }
                  disabled={!weeklyYear}
                >
                  <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white focus:border-purple-500 focus:ring-purple-500/20 h-11 rounded-lg transition-all disabled:opacity-50">
                    <SelectValue placeholder="Bulan" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    {monthOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="focus:bg-purple-500 focus:text-white transition-colors cursor-pointer"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                Minggu
              </span>
              <div className="w-56">
                <Select
                  value={get("date") ?? ""}
                  onValueChange={(value) => set("date", value)}
                  disabled={!weeklyYear || !weeklyMonth}
                >
                  <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white focus:border-purple-500 focus:ring-purple-500/20 h-11 rounded-lg transition-all disabled:opacity-50">
                    <SelectValue placeholder="Pilih Minggu" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    {weekOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="focus:bg-purple-500 focus:text-white transition-colors cursor-pointer"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                Tahun
              </span>
              <div className="w-32">
                <Select
                  value={year ?? ""}
                  onValueChange={(value) => set("year", value)}
                >
                  <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white focus:border-purple-500 focus:ring-purple-500/20 h-11 rounded-lg transition-all">
                    <SelectValue placeholder="Tahun" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    {yearOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="focus:bg-purple-500 focus:text-white transition-colors cursor-pointer"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                Pilih Periode
              </span>
              <div className="w-64">
                <Select
                  value={month ?? ""}
                  onValueChange={(value) => set("month", value)}
                >
                  <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500/20 h-11 rounded-lg transition-all">
                    <SelectValue placeholder="Pilih Bulan" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    {monthOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value.toString()}
                        className="focus:bg-purple-500 focus:text-white transition-colors cursor-pointer"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}