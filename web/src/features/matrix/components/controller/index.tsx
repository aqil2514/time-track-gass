import { DashboardDateFilter } from "@/features/dashboard/components/filter/date.filter";

export function MatrixController() {
  return (
    <div className="flex gap-4">
      <DashboardDateFilter />
    </div>
  );
}
