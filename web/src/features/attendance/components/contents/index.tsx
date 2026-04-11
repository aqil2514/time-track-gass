import {
  ContentTabConfig,
  ContextManager,
} from "@/components/molecules/context-manage";

const tabsConfig: ContentTabConfig[] = [
  {
    value: "summary",
    label: "Ringkasan",
    Component: "Ringkasan",
  },
  {
    value: "user-config",
    label: "Manajemen User",
    Component: "Manajemen User",
  },
  {
    value: "note-list",
    label: "List Note",
    Component: "List Note",
  },
];

export function AttendanceContextManager() {
  return <ContextManager defaultValue="summary" tabsConfig={tabsConfig} />;
}
