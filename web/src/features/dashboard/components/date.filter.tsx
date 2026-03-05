"use client";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, addDays, subDays } from "date-fns";
import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

export function DashboardDateFilter() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  function nextDay() {
    if (!date) return;
    setDate(addDays(date, 1));
  }

  function prevDay() {
    if (!date) return;
    setDate(subDays(date, 1));
  }

  return (
    <div className="flex items-center border border-gray-600 bg-gray-800 px-1 rounded-2xl">

      {/* Previous Day */}
      <button
        onClick={prevDay}
        className="cursor-pointer p-2 rounded-md hover:bg-gray-700 transition text-white"
      >
        <ChevronLeft size={16} />
      </button>

      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 transition rounded-lg px-3 py-2 shadow-sm text-white text-sm font-medium">

            <CalendarDays size={16} className="text-gray-300" />

            {date ? format(date, "EEE, dd MMM yyyy") : "Pick a date"}
          </button>
        </PopoverTrigger>

        <PopoverContent className="bg-gray-800 border border-gray-600 p-3 w-auto">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md text-white"
          />
        </PopoverContent>
      </Popover>

      {/* Next Day */}
      <button
        onClick={nextDay}
        className="cursor-pointer p-2 rounded-md hover:bg-gray-700 transition text-white"
      >
        <ChevronRight size={16} />
      </button>

    </div>
  );
}