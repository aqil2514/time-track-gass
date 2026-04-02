"use client";
import { DataTable } from "@/components/containers/data-table";
import { useDivisionContext } from "../../provider/divisions.provider";
import { divisionColumns } from "./divisions-columns";

export function DivisionsTable() {
  const { data } = useDivisionContext();

  return (
    <div>
      <DataTable columns={divisionColumns} data={data.data} />
    </div>
  );
}
