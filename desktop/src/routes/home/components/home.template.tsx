import MainContainer from "@/components/containers/main-container";
import { Controller } from "./controller";
import { DashboardHeader } from "@/components/layout/header";

export function HomeTemplate() {
  return (
    <>
      <DashboardHeader />
      <MainContainer>
        <Controller />
      </MainContainer>
    </>
  );
}
