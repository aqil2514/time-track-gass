import { DashboardDateFilter } from "@/features/dashboard/components/filter/date.filter";
import { MatrixDivisionFilter } from "./division-filter";

export function MatrixController() {
  return (
    <div className="flex flex-col items-start gap-4">
      <DashboardDateFilter />
      <MatrixDivisionFilter />
    </div>
  );
}

