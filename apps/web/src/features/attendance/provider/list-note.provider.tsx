import { createFetcherContext } from "@/utils/create-fetcher-context";
import React from "react";
import { ActivityAdjustmentListDb } from "../interfaces/activity-adjustment-list.interface";

const { Provider, useCtx: useListNote } = createFetcherContext<ActivityAdjustmentListDb>();

function ListNoteProvider({ children }: { children: React.ReactNode }) {
  return <Provider url={"/api/attendance/list-note"}>{children}</Provider>;
}

export { useListNote, ListNoteProvider };
