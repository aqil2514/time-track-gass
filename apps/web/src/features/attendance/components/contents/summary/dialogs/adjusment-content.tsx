import { ControlledDialogContainer } from "@/components/containers/controlled-dialog-container";
import {
  AdjustmentContentProvider,
  useAdjustmentContent,
} from "@/features/attendance/provider/adjustment-content.provider";
import { useQueryParams } from "@/hooks/use-query-params";
import { SummaryAdjustmentContent } from "../sub/adjustment-content";

export function AdjustmentContentDialog() {
  const { get } = useQueryParams();
  const open = get("action") === "adjustment-content";

  if (!open) return null;
  return (
    <AdjustmentContentProvider>
      <InnerTemplate />
    </AdjustmentContentProvider>
  );
}

const InnerTemplate = () => {
  const { get, remove } = useQueryParams();
  const { dispatch } = useAdjustmentContent();
  const open = get("action") === "adjustment-content";

  const handleClose = (open: boolean) => {
    if (!open) {
      remove("action");
      dispatch({
        type: "SET_ACTION",
        payload: { action: "standby", adjustmentId: null },
      });
    }
  };
  
  return (
    <ControlledDialogContainer
      title="Penyesuaian yang Aktif"
      description="Lihat penyesuaian yang aktif pada periode ini"
      onOpenChange={handleClose}
      open={open}
      className="sm:max-w-7xl"
    >
      <SummaryAdjustmentContent />
    </ControlledDialogContainer>
  );
};
