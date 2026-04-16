import { ContentContainer } from "@/components/containers/content-container";
import {
  SummaryAttendanceProvider,
  useSummaryAttendance,
} from "@/features/attendance/provider/summary.provider";
import { SummaryController } from "./controller";
import { useAttendanceLogsColumns } from "./table/columns";
import { DataTable } from "@/components/containers/data-table";
import { AddAdjustmentDialog } from "./dialogs/add-adjustment";
import { DetailDialog } from "./dialogs/detail";
import { AdjustmentContentDialog } from "./dialogs/adjusment-content";

export function AttendanceSummary() {
  return (
    <SummaryAttendanceProvider>
      <InnerTemplate />
    </SummaryAttendanceProvider>
  );
}

const InnerTemplate = () => {
  const { data } = useSummaryAttendance();

  const columns = useAttendanceLogsColumns();
  return (
    <>
      <ContentContainer title="Ringkasan" description="Ringkasan">
        <SummaryController />
        <DataTable enableSorting={true} data={data ?? []} columns={columns} />
      </ContentContainer>

      <AddAdjustmentDialog />
      <DetailDialog />
      <AdjustmentContentDialog />
    </>
  );
};
