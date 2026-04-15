import { PrimaryButton } from "@/components/atoms/primary-button";
import { Download, Loader2 } from "lucide-react";
import { useHomeContext } from "../../store/home.provider";

export function ExportToExcelButton() {
  const { controllerExcel, fetcher } = useHomeContext();
  const { exportToExcel, isLoading } = controllerExcel;

  const handleExport = async () => {
    if (isLoading) return;
    const items = fetcher.data?.activities?.flatMap((data) => data.items);
    await exportToExcel(items ?? []);
  };

  return (
    <PrimaryButton
      onClick={handleExport}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Export To Excel
        </>
      )}
    </PrimaryButton>
  );
}