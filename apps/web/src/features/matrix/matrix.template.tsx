"use client";
import { TitleAndSub } from "@/components/atoms/title-and-sub";
import { MatrixController } from "./components/controller";
import { MatrixData } from "./components/data";
import { MatrixProvider, useMatrixContext } from "./provider/matrix.provider";
import { MutateButton } from "@/components/atoms/mutate-button";
import { TemplateContainer } from "@/components/containers/template-container";

export function MatrixTemplate() {
  return (
    <MatrixProvider>
      <InnerTemplate />
    </MatrixProvider>
  );
}

const InnerTemplate = () => {
  const { mutate } = useMatrixContext();
  return (
    <>
      <TemplateContainer>
        <div className="flex gap-4 items-center">
          <MutateButton mutate={mutate} size="icon-xs" />
          <TitleAndSub
            title="Matriks Aktivitas"
            sub="Log aktivitas harian berdasarkan intensitas interaksi"
          />
        </div>
        <MatrixController />
        <MatrixData />
      </TemplateContainer>
    </>
  );
};
