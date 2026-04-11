import {
  ContentTabConfig,
  ContextManager,
} from "@/components/molecules/context-manage";
import { AttendanceSummary } from "./summary";
import { AttendanceUserManagement } from "./user-management";
import { AttendanceListNote } from "./list-note";

const tabsConfig: ContentTabConfig[] = [
  {
    value: "summary",
    label: "Ringkasan",
    Component: <AttendanceSummary />,
  },
  {
    value: "user-config",
    label: "Manajemen User",
    Component: <AttendanceUserManagement />,
  },
  {
    value: "note-list",
    label: "List Note",
    Component: <AttendanceListNote />,
  },
];

export function AttendanceContextManager() {
  return <ContextManager defaultValue="summary" tabsConfig={tabsConfig} />;
}
