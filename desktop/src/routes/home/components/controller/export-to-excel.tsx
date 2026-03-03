import { PrimaryButton } from "@/components/atoms/primary-button";
import { Download } from "lucide-react";

export function ExportToExcelButton() {
  return (
    <PrimaryButton>
      <Download /> Export To Excel
    </PrimaryButton>
  );
}
