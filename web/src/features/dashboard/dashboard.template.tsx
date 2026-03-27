"use client";
import { MainContainer } from "@/components/containers/main-container";
import { DashboardUserFilter } from "./components/filter/user-filter";
import { DashboardDateFilter } from "./components/filter/date.filter";
import { DashboardDataContent } from "./components/data";
import { DashboardProvider } from "./provider/dashboard.provider";
import { SessionSummaryTriggerPopover } from "./components/triggers/session-summary.trigger";
import { TitleAndSub } from "@/components/atoms/title-and-sub";

export function DashboardTemplate() {
  return (
    <DashboardProvider>
      <MainContainer className="space-y-4">
        <TitleAndSub title="Dashboard" sub="Ringkasan aktivitas tim" />
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <DashboardUserFilter />
            <DashboardDateFilter />
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <SessionSummaryTriggerPopover />
          </div>
        </div>
        <DashboardDataContent />
      </MainContainer>
    </DashboardProvider>
  );
}
