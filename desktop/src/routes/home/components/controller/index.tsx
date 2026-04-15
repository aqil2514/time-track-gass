import { ExportToExcelButton } from "./export-to-excel";
import { StartSessionButton } from "./start-session";
import { DatePicker } from "@/components/molecules/date-picker";
import { TimerStatusBadge } from "./timer-status-badge";
import { MutateButton } from "@/components/atoms/mutate-button";
import { useHomeContext } from "../../store/home.provider";
import { TimelineTotalWork } from "./total-work";

export function Controller() {
  const { fetcher } = useHomeContext();

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <DatePicker date={fetcher.date} setDate={fetcher.setDate} />
        <StartSessionButton />
        <ExportToExcelButton />
      </div>

      <div className="flex justify-between">
        <div className="flex gap-4 items-center">
          <MutateButton mutate={fetcher.mutate} />
          <TimerStatusBadge />
        </div>
        <TimelineTotalWork />
      </div>
    </div>
  );
}
