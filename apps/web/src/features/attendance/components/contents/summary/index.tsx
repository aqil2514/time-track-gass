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
import { useQueryParams } from "@/hooks/use-query-params";
import { useMemo } from "react";

export function AttendanceSummary() {
  return (
    <SummaryAttendanceProvider>
      <InnerTemplate />
    </SummaryAttendanceProvider>
  );
}

const InnerTemplate = () => {
  const { data } = useSummaryAttendance();
  const { get } = useQueryParams();
  const selectedDivision = get("division");

  const filteredData = useMemo(() => {
    if (!selectedDivision) return data ?? [];
    return (data ?? []).filter((item) => item.division === selectedDivision);
  }, [data, selectedDivision]);

  const columns = useAttendanceLogsColumns();
  return (
    <>
      <ContentContainer title="Ringkasan" description="Ringkasan">
        <SummaryController />
        <DataTable enableSorting={true} data={filteredData} columns={columns} />
      </ContentContainer>

      <AddAdjustmentDialog />
      <DetailDialog />
      <AdjustmentContentDialog />
    </>
  );
};
