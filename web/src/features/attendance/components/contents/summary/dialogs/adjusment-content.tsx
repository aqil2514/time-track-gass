import { ControlledDialogContainer } from "@/components/containers/controlled-dialog-container";
import { useQueryParams } from "@/hooks/use-query-params";

export function AdjustmentContentDialog() {
  const { get, remove } = useQueryParams();
  const open = get("action") === "adjustment-content";
  return (
    <ControlledDialogContainer
      title="Penyesuaian yang Aktif"
      description="Lihat penyesuaian yang aktif pada periode ini"
      onOpenChange={(open) => {
        if (!open) return remove("action");
      }}
      open={open}
      className="sm:max-w-7xl"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>Tabel</div>
        <div>Aksi</div>
      </div>
    </ControlledDialogContainer>
  );
}
