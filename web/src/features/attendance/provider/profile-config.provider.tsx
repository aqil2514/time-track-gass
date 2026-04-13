import { createFetcherContext } from "@/utils/create-fetcher-context";
import React from "react";
import { ProfileWorkConfigsPopulateProfile } from "../interfaces/profile-work-configs.interface";

const { Provider, useCtx: useProfileConfig } = createFetcherContext<ProfileWorkConfigsPopulateProfile>();

function ProfileConfigProvider({ children }: { children: React.ReactNode }) {
  return <Provider url={"/api/attendance/profile-config"}>{children}</Provider>;
}

export { useProfileConfig, ProfileConfigProvider };
