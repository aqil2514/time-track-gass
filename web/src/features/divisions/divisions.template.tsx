"use client";
import { TitleAndSub } from "@/components/atoms/title-and-sub";
import { TemplateContainer } from "@/components/containers/template-container";
import {
  DivisionsProvider,
  useDivisionContext,
} from "./provider/divisions.provider";

export function DivisionTemplate() {
  return (
    <DivisionsProvider>
      <InnerTemplate />
    </DivisionsProvider>
  );
}

const InnerTemplate = () => {
  const { data } = useDivisionContext();

  console.log(data);
  return (
    <>
      <TemplateContainer>
        <TitleAndSub
          title="Manajemen Divisi"
          sub="Kelola departemen dan struktur organisasi Anda di sini"
        />
      </TemplateContainer>
    </>
  );
};
