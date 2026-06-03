/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { DataTable } from "@/components/containers/data-table";
import { activityColumns } from "./activity-columns";
import { useActivity } from "../../provider/activity.provider";
import { useEffect, useMemo, useState } from "react";
import { AIScreenReportDb } from "@/features/dashboard/interface/ai-screen-db.interface";
import { ActivityBulkAction } from "../activity-bulk-action";
import { useQueryParams } from "@/hooks/use-query-params";

export function ActivityTable() {
  const { data } = useActivity();
  const { get } = useQueryParams();
  const [selectData, setSelectData] = useState<AIScreenReportDb[]>([]);

  const user = get("user");
  const date = get("date");
  const total = data.data.length;
  const isSelectedData = useMemo(() => selectData.length > 0, [selectData]);

  const tableKey = useMemo(() => {
    return `${date}-${user}-${total}`;
  }, [user, date, total]);

  useEffect(() => {
    setSelectData([]);
  }, [tableKey]);

  return (
    <div>
      {isSelectedData && <ActivityBulkAction selectedData={selectData} />}
      <DataTable
        key={tableKey}
        columns={activityColumns}
        data={data.data}
        enableRowSelection={true}
        onRowSelectionChange={setSelectData}
      />
    </div>
  );
}
