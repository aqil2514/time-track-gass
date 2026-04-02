"use client";
import { TitleAndSub } from "@/components/atoms/title-and-sub";
import { TemplateContainer } from "@/components/containers/template-container";
import { DivisionsProvider } from "./provider/divisions.provider";
import { DivisionsTable } from "./components/table/divisions-table";

export function DivisionTemplate() {
  return (
    <DivisionsProvider>
      <InnerTemplate />
    </DivisionsProvider>
  );
}

const InnerTemplate = () => {
  return (
    <>
      <TemplateContainer>
        <TitleAndSub
          title="Manajemen Divisi"
          sub="Kelola departemen dan struktur organisasi Anda di sini"
        />
        
        <DivisionsTable />
      </TemplateContainer>
    </>
  );
};
