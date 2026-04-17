import { LoadingSpinner } from "@/components/atoms/loading-spinner";
import { DataTable } from "@/components/containers/data-table";
import { useAdjustmentContent } from "@/features/attendance/provider/adjustment-content.provider";
import { AlertCircle } from "lucide-react";
import { useAdjustmentContentColumns } from "./columns";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export function SideLeft() {
  const { data, error, isLoading } = useAdjustmentContent();
  const columns = useAdjustmentContentColumns();

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Gagal memuat data penyesuaian.</span>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner label="Memuat data penyesuaian..." />
      ) : (
        <ScrollArea className="h-96 w-full rounded-md border border-slate-700/50">
          <DataTable
            data={data?.adjustmentContent ?? []}
            columns={columns}
            enableSorting={true}
          />
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      )}
    </div>
  );
}
