"use client";
import { DataTable } from "@/components/containers/data-table";
import { activityColumns } from "./activity-columns";
import { useActivity } from "../../provider/activity.provider";
import { useMemo, useState } from "react";
import { AIScreenReportDb } from "@/features/dashboard/interface/ai-screen-db.interface";
import { ActivityBulkAction } from "../activity-bulk-action";

export function ActivityTable() {
  const { data } = useActivity();
  const [selectData, setSelectData] = useState<AIScreenReportDb[]>([]);

  const isSelectedData = useMemo(() => selectData.length > 0, [selectData]);

  return (
    <div>
      {isSelectedData && <ActivityBulkAction selectedData={selectData} />}
      <DataTable
        columns={activityColumns}
        data={data.data}
        enableRowSelection={true}
        onRowSelectionChange={setSelectData}
      />
    </div>
  );
}
