import {
  ContentTabConfig,
  ContextManager,
} from "@/components/molecules/context-manage";
import { useUserSetting } from "../../providers/team-setting.provider";
import { TrackerSetting } from "./content-tracker";

const ContentComponent: ContentTabConfig[] = [
  {
    label: "Tracker",
    value: "tracker",
    Component: <TrackerSetting />,
  },
];

export function SettingContent() {
  const { content, setContent } = useUserSetting();
  return (
    <ContextManager
      defaultValue="track"
      content={content}
      onContentChange={setContent}
      tabsConfig={ContentComponent}
    />
  );
}
