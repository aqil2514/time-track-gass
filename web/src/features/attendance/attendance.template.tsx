import { TitleAndSub } from "@/components/atoms/title-and-sub";
import { TemplateContainer } from "@/components/containers/template-container";
import { AttendanceContextManager } from "./components/contents";

export function AttendanceSummaryTemplate() {
  return (
    <>
      <InnerTemplate />
    </>
  );
}

const InnerTemplate = () => {
  return (
    <>
      <TemplateContainer>
        <TitleAndSub
          title="Absensi Kehadiran"
          sub="Cek dan Manajemen absensi kehadiran"
        />

        <AttendanceContextManager />
      </TemplateContainer>
    </>
  );
};
