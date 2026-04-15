import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQueryParams } from "@/hooks/use-query-params";
import { Plus } from "lucide-react";

export function AdjustmentButton() {
  const { set } = useQueryParams();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={() => set("action", "add-adjustment")}
          variant={"accent"}
          size={"icon-sm"}
        >
          <Plus />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Tambah Penyesuaian</p>
      </TooltipContent>
    </Tooltip>
  );
}
