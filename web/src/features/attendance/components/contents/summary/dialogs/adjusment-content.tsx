import { ControlledDialogContainer } from "@/components/containers/controlled-dialog-container";
import { AdjustmentContentProvider } from "@/features/attendance/provider/adjustment-content.provider";
import { useQueryParams } from "@/hooks/use-query-params";
import { SummaryAdjustmentContent } from "../adjustment-content";

export function AdjustmentContentDialog() {
  const { get, remove } = useQueryParams();
  const open = get("action") === "adjustment-content";
  return (
    <AdjustmentContentProvider>
      <ControlledDialogContainer
        title="Penyesuaian yang Aktif"
        description="Lihat penyesuaian yang aktif pada periode ini"
        onOpenChange={(open) => {
          if (!open) return remove("action");
        }}
        open={open}
        className="sm:max-w-7xl"
      >
        <SummaryAdjustmentContent />
      </ControlledDialogContainer>
    </AdjustmentContentProvider>
  );  
}
