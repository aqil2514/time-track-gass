import { useAdjustmentContent } from "@/features/attendance/provider/adjustment-content.provider";
import { SideRightStandby } from "./standby";
import { SideRightDetail } from "./detail";
import { SideRightDelete } from "./delete";
import { SideRightEdit } from "./edit";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export function SideRight() {
  return (
    <ScrollArea className="h-96 w-full rounded-md border border-slate-700/50">
      <div className="min-h-full p-0">
        <InnerElement />
      </div>
      <ScrollBar orientation="vertical" />
    </ScrollArea>
  );
}

const InnerElement = () => {
  const { state } = useAdjustmentContent();

  switch (state.action) {
    case "standby":
      return <SideRightStandby />;
    case "delete":
      return <SideRightDelete />;
    case "edit":
      return <SideRightEdit key={state.adjustmentId} />;
    case "detail":
      return <SideRightDetail />;
    default:
      return <SideRightStandby />;
  }
};
