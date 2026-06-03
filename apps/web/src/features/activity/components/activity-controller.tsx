import { DashboardDateFilter } from "@/features/dashboard/components/filter/date.filter";
import { DashboardUserFilter } from "@/features/dashboard/components/filter/user-filter";

export function ActivityController() {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <DashboardUserFilter />
      <DashboardDateFilter />
    </div>
  );
}
