import MainContainer from "@/components/containers/main-container";
import { Controller } from "./controller";
import { DashboardHeader } from "@/components/layout/header";
import { ActivityData } from "./data";

export function HomeTemplate() {
  return (
    <>
      <DashboardHeader />
      <MainContainer className="space-y-4">
        <Controller />
        <ActivityData />
      </MainContainer>
    </>
  );
}
