import { MainContainer } from "@/components/containers/main-container";
import { DashboardUserFilter } from "./components/filter/user.filter";
import { DashboardDateFilter } from "./components/filter/date.filter";
import { DashboardDataContent } from "./components/data";

export function DashboardTemplate() {
  return (
    <MainContainer className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <DashboardUserFilter />
        <DashboardDateFilter />
      </div>
      <DashboardDataContent />
    </MainContainer>
  );
}
