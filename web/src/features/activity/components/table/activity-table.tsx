"use client";
import { DataTable } from "@/components/containers/data-table";
import { activityColumns } from "./activity-columns";
import { useActivity } from "../../provider/activity.provider";

export function ActivityTable() {
  const { data } = useActivity();

  return (
    <div>
      <DataTable columns={activityColumns} data={data.data} />
    </div>
  );
}
