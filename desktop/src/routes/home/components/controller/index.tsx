import { useState } from "react";
import { ExportToExcelButton } from "./export-to-excel";
import { StartSessionButton } from "./start-session";
import { DatePicker } from "@/components/molecules/date-picker";
import { TimerStatusBadge } from "./timer-status-badge";
import { MutateButton } from "@/components/atoms/mutate-button";
import { useHomeContext } from "../../store/home.provider";

export function Controller() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const {fetcher} = useHomeContext()

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <DatePicker date={date} setDate={setDate} />
        <StartSessionButton />
        <ExportToExcelButton />
      </div>

      <div className="flex gap-4">
        <MutateButton mutate={fetcher.mutate} />
        <TimerStatusBadge />
      </div>
    </div>
  );
}
