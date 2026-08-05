"use client";
import { TitleAndSub } from "@/components/atoms/title-and-sub";
import { MatrixController } from "./components/controller";
import { MatrixData } from "./components/data";
import { MatrixProvider, useMatrixContext } from "./provider/matrix.provider";
import { MatrixRangeProvider, useMatrixRangeContext } from "./provider/matrix-range.provider";
import { MultiDayGrid } from "./components/data/multi-day/multi-day-grid";
import { MutateButton } from "@/components/atoms/mutate-button";
import { TemplateContainer } from "@/components/containers/template-container";
import { useQueryParams } from "@/hooks/use-query-params";

export function MatrixTemplate() {
  return (
    <MatrixProvider>
      <MatrixRangeProvider>
        <InnerTemplate />
      </MatrixRangeProvider>
    </MatrixProvider>
  );
}

const InnerTemplate = () => {
  const { mutate: mutateSingle } = useMatrixContext();
  const { mutate: mutateRange } = useMatrixRangeContext();
  const { get } = useQueryParams();

  const isRange = !!get("from") && !!get("to");

  return (
    <>
      <TemplateContainer>
        <div className="flex gap-4 items-center">
          <MutateButton mutate={(isRange ? mutateRange : mutateSingle) as Parameters<typeof MutateButton>[0]["mutate"]} size="icon-xs" />
          <TitleAndSub
            title="Matriks Aktivitas"
            sub="Log aktivitas harian berdasarkan intensitas interaksi"
          />
        </div>
        <MatrixController />
        {isRange ? <MultiDayGrid /> : <MatrixData />}
      </TemplateContainer>
    </>
  );
};
