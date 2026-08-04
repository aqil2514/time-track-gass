"use client";

import * as React from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfToday,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useQueryParams } from "@/hooks/use-query-params";

type PickerMode = "single" | "range";
type PresetGroupKey = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
type StepUnit = "day" | "week" | "month" | "quarter" | "year";
type PresetId =
  | "today"
  | "yesterday"
  | "last7Days"
  | "thisWeekToDate"
  | "thisWeek"
  | "lastWeek"
  | "last2Weeks"
  | "thisMonthToDate"
  | "thisMonth"
  | "lastMonth"
  | "last3Months"
  | "last6Months"
  | "thisQ1" | "thisQ2" | "thisQ3" | "thisQ4"
  | "lastQ1" | "lastQ2" | "lastQ3" | "lastQ4"
  | "thisYear"
  | "lastYear";

interface PresetItem {
  id: PresetId;
  label: string;
  stepUnit: StepUnit;
  getRange: (anchor: Date) => DateRange;
}

interface DateFilterProps {
  queryKey: string;
}

const tabItems: Array<{ value: PresetGroupKey; label: string }> = [
  { value: "daily", label: "Hari" },
  { value: "weekly", label: "Minggu" },
  { value: "monthly", label: "Bulan" },
  { value: "quarterly", label: "Kuartal" },
  { value: "yearly", label: "Tahun" },
];

function startOfQuarterN(year: number, q: 1 | 2 | 3 | 4): Date {
  return new Date(year, (q - 1) * 3, 1);
}
function endOfQuarterN(year: number, q: 1 | 2 | 3 | 4): Date {
  return endOfMonth(new Date(year, q * 3 - 1, 1));
}

const presetGroups: Record<PresetGroupKey, PresetItem[]> = {
  daily: [
    {
      id: "today",
      label: "Hari Ini",
      stepUnit: "day",
      getRange: (anchor) => ({ from: anchor, to: anchor }),
    },
    {
      id: "yesterday",
      label: "Kemarin",
      stepUnit: "day",
      getRange: (anchor) => {
        const day = subDays(anchor, 1);
        return { from: day, to: day };
      },
    },
    {
      id: "last7Days",
      label: "7 Hari Terakhir",
      stepUnit: "week",
      getRange: (anchor) => ({ from: subDays(anchor, 6), to: anchor }),
    },
    {
      id: "thisWeekToDate",
      label: "Minggu Ini s/d Hari Ini",
      stepUnit: "week",
      getRange: (anchor) => ({
        from: startOfWeek(anchor, { weekStartsOn: 1 }),
        to: anchor,
      }),
    },
  ],
  weekly: [
    {
      id: "thisWeek",
      label: "Minggu Ini",
      stepUnit: "week",
      getRange: (anchor) => ({
        from: startOfWeek(anchor, { weekStartsOn: 1 }),
        to: endOfWeek(anchor, { weekStartsOn: 1 }),
      }),
    },
    {
      id: "lastWeek",
      label: "Minggu Lalu",
      stepUnit: "week",
      getRange: (anchor) => {
        const week = subWeeks(anchor, 1);
        return {
          from: startOfWeek(week, { weekStartsOn: 1 }),
          to: endOfWeek(week, { weekStartsOn: 1 }),
        };
      },
    },
    {
      id: "last2Weeks",
      label: "2 Minggu Terakhir",
      stepUnit: "week",
      getRange: (anchor) => ({
        from: startOfWeek(subWeeks(anchor, 1), { weekStartsOn: 1 }),
        to: endOfWeek(anchor, { weekStartsOn: 1 }),
      }),
    },
  ],
  monthly: [
    {
      id: "thisMonth",
      label: "Bulan Ini",
      stepUnit: "month",
      getRange: (anchor) => ({
        from: startOfMonth(anchor),
        to: endOfMonth(anchor),
      }),
    },
    {
      id: "thisMonthToDate",
      label: "Bulan Ini s/d Hari Ini",
      stepUnit: "month",
      getRange: (anchor) => ({
        from: startOfMonth(anchor),
        to: anchor,
      }),
    },
    {
      id: "lastMonth",
      label: "Bulan Lalu",
      stepUnit: "month",
      getRange: (anchor) => {
        const month = subMonths(anchor, 1);
        return { from: startOfMonth(month), to: endOfMonth(month) };
      },
    },
    {
      id: "last3Months",
      label: "3 Bulan Terakhir",
      stepUnit: "month",
      getRange: (anchor) => ({
        from: startOfMonth(subMonths(anchor, 2)),
        to: endOfMonth(anchor),
      }),
    },
    {
      id: "last6Months",
      label: "6 Bulan Terakhir",
      stepUnit: "month",
      getRange: (anchor) => ({
        from: startOfMonth(subMonths(anchor, 5)),
        to: endOfMonth(anchor),
      }),
    },
  ],
  quarterly: [
    {
      id: "thisQ1",
      label: "Q1 Tahun Ini",
      stepUnit: "quarter",
      getRange: (anchor) => ({
        from: startOfQuarterN(anchor.getFullYear(), 1),
        to: endOfQuarterN(anchor.getFullYear(), 1),
      }),
    },
    {
      id: "thisQ2",
      label: "Q2 Tahun Ini",
      stepUnit: "quarter",
      getRange: (anchor) => ({
        from: startOfQuarterN(anchor.getFullYear(), 2),
        to: endOfQuarterN(anchor.getFullYear(), 2),
      }),
    },
    {
      id: "thisQ3",
      label: "Q3 Tahun Ini",
      stepUnit: "quarter",
      getRange: (anchor) => ({
        from: startOfQuarterN(anchor.getFullYear(), 3),
        to: endOfQuarterN(anchor.getFullYear(), 3),
      }),
    },
    {
      id: "thisQ4",
      label: "Q4 Tahun Ini",
      stepUnit: "quarter",
      getRange: (anchor) => ({
        from: startOfQuarterN(anchor.getFullYear(), 4),
        to: endOfQuarterN(anchor.getFullYear(), 4),
      }),
    },
    {
      id: "lastQ1",
      label: "Q1 Tahun Lalu",
      stepUnit: "quarter",
      getRange: (anchor) => ({
        from: startOfQuarterN(anchor.getFullYear() - 1, 1),
        to: endOfQuarterN(anchor.getFullYear() - 1, 1),
      }),
    },
    {
      id: "lastQ2",
      label: "Q2 Tahun Lalu",
      stepUnit: "quarter",
      getRange: (anchor) => ({
        from: startOfQuarterN(anchor.getFullYear() - 1, 2),
        to: endOfQuarterN(anchor.getFullYear() - 1, 2),
      }),
    },
    {
      id: "lastQ3",
      label: "Q3 Tahun Lalu",
      stepUnit: "quarter",
      getRange: (anchor) => ({
        from: startOfQuarterN(anchor.getFullYear() - 1, 3),
        to: endOfQuarterN(anchor.getFullYear() - 1, 3),
      }),
    },
    {
      id: "lastQ4",
      label: "Q4 Tahun Lalu",
      stepUnit: "quarter",
      getRange: (anchor) => ({
        from: startOfQuarterN(anchor.getFullYear() - 1, 4),
        to: endOfQuarterN(anchor.getFullYear() - 1, 4),
      }),
    },
  ],
  yearly: [
    {
      id: "thisYear",
      label: "Tahun Ini",
      stepUnit: "year",
      getRange: (anchor) => ({
        from: startOfYear(anchor),
        to: endOfYear(anchor),
      }),
    },
    {
      id: "lastYear",
      label: "Tahun Lalu",
      stepUnit: "year",
      getRange: (anchor) => {
        const y = subYears(anchor, 1);
        return { from: startOfYear(y), to: endOfYear(y) };
      },
    },
  ],
};

function normalizeRange(range: DateRange | undefined) {
  if (!range?.from || !range.to) return undefined;
  return {
    from: new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate()),
    to: new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate()),
  };
}

function isSameRange(left: DateRange | undefined, right: DateRange | undefined) {
  const l = normalizeRange(left);
  const r = normalizeRange(right);
  if (!l || !r) return false;
  return l.from.getTime() === r.from.getTime() && l.to.getTime() === r.to.getTime();
}

function shiftDateByUnit(date: Date, stepUnit: StepUnit, direction: 1 | -1): Date {
  if (stepUnit === "day") return direction === 1 ? addDays(date, 1) : subDays(date, 1);
  if (stepUnit === "week") return direction === 1 ? addWeeks(date, 1) : subWeeks(date, 1);
  if (stepUnit === "month") return direction === 1 ? addMonths(date, 1) : subMonths(date, 1);
  if (stepUnit === "quarter") return direction === 1 ? addMonths(date, 3) : subMonths(date, 3);
  return direction === 1 ? addYears(date, 1) : subYears(date, 1);
}

function formatRangeLabel(date: DateRange | undefined, mode: PickerMode): string {
  if (!date?.from) return "Pilih tanggal";
  if (mode === "single") return format(date.from, "EEE, dd MMM yyyy");
  if (!date.to) return format(date.from, "dd MMM yyyy");
  return `${format(date.from, "dd MMM yyyy")} - ${format(date.to, "dd MMM yyyy")}`;
}

export function DateFilter({ queryKey }: DateFilterProps) {
  const { get, update } = useQueryParams();
  const today = startOfToday();

  const urlDate = get(queryKey);
  const urlFrom = get("from");
  const urlTo = get("to");

  const date: DateRange | undefined = React.useMemo(() => {
    if (urlFrom && urlTo) return { from: new Date(urlFrom), to: new Date(urlTo) };
    if (urlDate) return { from: new Date(urlDate), to: new Date(urlDate) };
    return undefined;
  }, [urlDate, urlFrom, urlTo]);

  const [activeGroup, setActiveGroup] = React.useState<PresetGroupKey>("daily");
  const [activePresetId, setActivePresetId] = React.useState<PresetId | null>(null);
  const [mode, setMode] = React.useState<PickerMode>("single");
  const [mobilePanel, setMobilePanel] = React.useState<"preset" | "custom">("preset");

  const activePreset = React.useMemo(
    () => activePresetId
      ? Object.values(presetGroups).flat().find((p) => p.id === activePresetId) ?? null
      : null,
    [activePresetId],
  );

  function handleSelect(range: DateRange | undefined) {
    if (!range?.from) {
      update({ [queryKey]: null, from: null, to: null });
      return;
    }
    const fmt = (d: Date) => format(d, "yyyy-MM-dd");
    const from = range.from;
    const to = range.to ?? range.from;
    if (fmt(from) === fmt(to)) {
      update({ [queryKey]: fmt(from), from: null, to: null });
    } else {
      update({ [queryKey]: null, from: fmt(from), to: fmt(to) });
    }
  }

  function applyPreset(group: PresetGroupKey, preset: PresetItem) {
    setActiveGroup(group);
    setActivePresetId(preset.id);
    setMode("range");
    handleSelect(preset.getRange(today));
  }

  function shiftRange(direction: 1 | -1) {
    if (!activePreset || !date?.from) return;
    const anchor = shiftDateByUnit(date.from, activePreset.stepUnit, direction);
    handleSelect(activePreset.getRange(anchor));
  }

  function handleCalendarRangeSelect(range: DateRange | undefined) {
    if (activePreset && isSameRange(range, activePreset.getRange(range?.from ?? today))) return;
    setActivePresetId(null);
    handleSelect(range);
  }

  function handleCalendarSingleSelect(day: Date | undefined) {
    setActivePresetId(null);
    handleSelect(day ? { from: day, to: day } : undefined);
  }

  function handleModeChange(newMode: PickerMode) {
    setMode(newMode);
    if (newMode === "single" && date?.from) {
      handleSelect({ from: date.from, to: date.from });
    }
  }

  return (
    <div className="flex w-fit items-center border border-gray-600 bg-gray-800 px-1 rounded-2xl">
      <button
        onClick={() => shiftRange(-1)}
        disabled={!activePreset || !date?.from}
        className="cursor-pointer p-2 rounded-md hover:bg-gray-700 transition text-white disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={16} />
      </button>

      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 transition rounded-lg px-3 py-2 shadow-sm text-white text-sm font-medium">
            <CalendarDays size={16} className="text-gray-300" />
            <span className="truncate">{formatRangeLabel(date, mode)}</span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[min(100vw-2rem,520px)] bg-gray-800 border border-gray-600 p-0 shadow-xl"
          align="start"
          collisionPadding={8}
        >
          {/* Mobile tab switcher */}
          <div className="flex border-b border-gray-600 md:hidden">
            {(["preset", "custom"] as const).map((panel) => (
              <button
                key={panel}
                type="button"
                className={cn(
                  "flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors text-gray-400",
                  mobilePanel === panel
                    ? "border-b-2 border-blue-400 text-blue-400"
                    : "hover:bg-gray-700",
                )}
                onClick={() => setMobilePanel(panel)}
              >
                {panel === "preset" ? "Preset" : "Kustom"}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-[200px_minmax(0,1fr)]">
            {/* Panel preset */}
            <Tabs
              value={activeGroup}
              onValueChange={(v) => setActiveGroup(v as PresetGroupKey)}
              className={cn(
                "border-b border-gray-600 bg-gray-900/30 md:border-r md:border-b-0",
                mobilePanel !== "preset" && "hidden md:block",
              )}
            >
              <div className="border-b border-gray-600 p-2">
                <ScrollArea className="w-full whitespace-nowrap">
                  <TabsList className="h-8 w-max min-w-full bg-gray-700/50 gap-1 p-1">
                    {tabItems.map((tab) => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="shrink-0 text-[10px] uppercase tracking-wider text-gray-300 data-[state=active]:bg-gray-600 data-[state=active]:text-white"
                      >
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>

              <ScrollArea className="max-h-72">
                <div className="p-2">
                  {Object.entries(presetGroups).map(([key, presets]) => (
                    <TabsContent key={key} value={key} className="mt-0">
                      <div className="space-y-1">
                        {presets.map((preset) => {
                          const isActive =
                            activePresetId === preset.id ||
                            isSameRange(date, preset.getRange(today));
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors text-gray-300 hover:bg-gray-700",
                                isActive && "bg-gray-700 text-white font-semibold",
                              )}
                              onClick={() => applyPreset(key as PresetGroupKey, preset)}
                            >
                              {preset.label}
                              <ChevronRight size={12} className="opacity-40" />
                            </button>
                          );
                        })}
                      </div>
                    </TabsContent>
                  ))}
                </div>
              </ScrollArea>
            </Tabs>

            {/* Panel kalender */}
            <div className={cn(
              "flex min-w-0 flex-col",
              mobilePanel !== "custom" && "hidden md:flex",
            )}>
              <div className="flex items-center justify-between border-b border-gray-600 px-4 py-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  {mode === "single" ? "Pilih Tanggal" : "Kustom Rentang"}
                </span>
                <div className="flex overflow-hidden rounded-md border border-gray-600 text-xs">
                  {(["single", "range"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={cn(
                        "px-2.5 py-1 transition-colors text-gray-300",
                        m === "range" && "border-l border-gray-600",
                        mode === m ? "bg-blue-600 text-white" : "hover:bg-gray-700",
                      )}
                      onClick={() => handleModeChange(m)}
                    >
                      {m === "single" ? "Tunggal" : "Rentang"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-2">
                {mode === "single" ? (
                  <Calendar
                    mode="single"
                    defaultMonth={date?.from}
                    selected={date?.from}
                    onSelect={handleCalendarSingleSelect}
                    className="mx-auto rounded-md text-white"
                  />
                ) : (
                  <Calendar
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={handleCalendarRangeSelect}
                    className="mx-auto rounded-md text-white"
                  />
                )}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <button
        onClick={() => shiftRange(1)}
        disabled={!activePreset || !date?.from}
        className="cursor-pointer p-2 rounded-md hover:bg-gray-700 transition text-white disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );

}
