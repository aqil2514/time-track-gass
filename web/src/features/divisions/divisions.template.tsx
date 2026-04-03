"use client";
import { TitleAndSub } from "@/components/atoms/title-and-sub";
import { TemplateContainer } from "@/components/containers/template-container";
import { DivisionsProvider } from "./provider/divisions.provider";
import { DivisionsTable } from "./components/table/divisions-table";
import { AddDialogs } from "./components/dialogs/add";
import { DivisionController } from "./components/controllers";
import { EditDialogs } from "./components/dialogs/edit";
import { DetailDialogs } from "./components/dialogs/detail";
import { DeleteDialogs } from "./components/dialogs/delete";

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

        <DivisionController />

        <DivisionsTable />
      </TemplateContainer>

      <DetailDialogs />
      <AddDialogs />
      <EditDialogs />
      <DeleteDialogs />
    </>
  );
};
