"use client"
import { TitleAndSub } from "@/components/atoms/title-and-sub";
import { MatrixController } from "./components/controller";
import { MatrixData } from "./components/data";
import { MatrixProvider } from "./provider/matrix.provider";

export function MatrixTemplate() {
  return (
    <MatrixProvider>
      <InnerTemplate />
    </MatrixProvider>
  );
}

const InnerTemplate = () => {
  return (
    <>
      <div className="w-full space-y-6 p-8">
        <TitleAndSub
          title="Matriks Aktivitas"
          sub="Log aktivitas harian berdasarkan intensitas interaksi"
        />
        <MatrixController />
        <MatrixData />
      </div>
    </>
  );
};
