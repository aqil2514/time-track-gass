import { createFetcherContext } from "@/utils/create-fetcher-context";
import React from "react";
import { ActivityAdjusmentListDb } from "../interfaces/activity-adjusment-list.interface";

const { Provider, useCtx: useListNote } = createFetcherContext<ActivityAdjusmentListDb>();

function ListNoteProvider({ children }: { children: React.ReactNode }) {
  return <Provider url={"/api/attendance/list-note"}>{children}</Provider>;
}

export { useListNote, ListNoteProvider };
