import { MainContainer } from "@/components/containers/main-container";
import { DashboardUserFilter } from "./components/user.filter";
import { DashboardDateFilter } from "./components/date.filter";

export function DashboardTemplate() {
  return (
    <MainContainer>
      <div className="flex flex-col md:flex-row gap-4">
        <DashboardUserFilter />
        <DashboardDateFilter />
      </div>
    </MainContainer>
  );
}
