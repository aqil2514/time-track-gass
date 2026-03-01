import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTimeTracker } from "../logic/use-time-tracker";
import { KeyedMutator } from "swr";
import { AIScreenReportDb } from "../types/ai-record.type";

interface Props {
  mutate: KeyedMutator<AIScreenReportDb[]>;
  data: AIScreenReportDb[]; // ← tambah prop data
}

export function TimeTrackerController({ mutate, data }: Props) {
  const {
    handleTimeChange,
    intervalSecondText,
    isLoadingManual,
    startAutoCapture,
    stopAutoCapture,
    captureHandler,
    isRunning,
    exportToExcel,       // ← tambah ini
    isLoadingExport,     // ← opsional, untuk loading state
  } = useTimeTracker(mutate);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <Button
          variant={"outline"}
          disabled={isLoadingManual || isRunning}
          onClick={captureHandler}
        >
          {isLoadingManual ? "Capturing..." : "Capture"}
        </Button>
        <Button
          variant={"outline"}
          disabled={isRunning || isLoadingManual}
          onClick={startAutoCapture}
        >
          Start Auto Capture
        </Button>
        <Button
          variant={"outline"}
          disabled={!isRunning}
          onClick={stopAutoCapture}
        >
          Stop Auto Capture
        </Button>

        {/* Tombol export baru */}
        <Button
          variant={"outline"}
          disabled={isLoadingExport || data.length === 0}
          onClick={() => exportToExcel(data)}
        >
          {isLoadingExport ? "Exporting..." : "Export to Excel"}
        </Button>
      </div>
      <div className="space-y-4">
        <Label>Pilih interval auto capture:</Label>
        <Input
          type="time"
          step={1}
          onChange={handleTimeChange}
          defaultValue={"00:10:00"}
          disabled={isRunning}
        />
        {isRunning ? (
          <p>Countdown: {intervalSecondText}</p>
        ) : (
          <p>Melakukan auto capture setiap {intervalSecondText}</p>
        )}
      </div>
    </div>
  );
}