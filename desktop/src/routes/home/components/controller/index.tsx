import { useState } from "react";
import { ExportToExcelButton } from "./export-to-excel";
import { StartSessionButton } from "./start-session";
import { DatePicker } from "@/components/molecules/date-picker";
import { TimerStatusBadge } from "./timer-status-badge";

export function Controller() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <DatePicker date={date} setDate={setDate} />
        <StartSessionButton />
        <ExportToExcelButton />
      </div>

      <TimerStatusBadge />
    </div>
  );
}
