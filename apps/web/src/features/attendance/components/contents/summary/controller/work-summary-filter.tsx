"use client";

import { LabelValue } from "@/@types/general";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardDateFilter } from "@/features/dashboard/components/filter/date.filter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar, Layers } from "lucide-react";
import { useQueryParams } from "@/hooks/use-query-params";

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

export function WorkSummaryFilter() {
  const { get, update, set } = useQueryParams();

  const mode = get("mode") ?? "weekly";
  const month = get("month");
  const year = get("year");

  const yearOptions = getYearOptions(3);

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
            update({ mode: "monthly", date: null, month: null, year: null });
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
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
              Rentang Tanggal
            </span>
            <DashboardDateFilter />
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
                  <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white focus:border-amber-500 focus:ring-amber-500/20 h-11 rounded-lg transition-all">
                    <SelectValue placeholder="Tahun" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    {yearOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="focus:bg-amber-500 focus:text-white transition-colors cursor-pointer"
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
                  <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20 h-11 rounded-lg transition-all">
                    <SelectValue placeholder="Pilih Bulan" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    {monthOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value.toString()}
                        className="focus:bg-amber-500 focus:text-white transition-colors cursor-pointer"
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