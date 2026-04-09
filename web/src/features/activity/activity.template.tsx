import { ActivityController } from "./components/activity-controller";
import { ActivityData } from "./components/activity-data";
import { ActivityHeader } from "./components/activity-header";
import { BulkDeleteDialog } from "./dialogs/bulk-delete";
import { DetailDialog } from "./dialogs/detail";
import { ActivityProvider } from "./provider/activity.provider";

export function ActivityTemplate() {
  return (
    <ActivityProvider>
      <InnerTemplate />
    </ActivityProvider>
  );
}

const InnerTemplate = () => {
  return (
    <>
      <div className="w-full space-y-6 p-8">
        <ActivityHeader />
        <ActivityController />
        <ActivityData />
      </div>

      <DetailDialog />
      <BulkDeleteDialog />
    </>
  );
};
