import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Dispatch, SetStateAction } from "react";

interface Props {
  selectedDivision: string;
  setSelectedDivision: Dispatch<SetStateAction<string>>;
  allDivisions: string[];
}

export function DivisionFilter({
  allDivisions,
  selectedDivision,
  setSelectedDivision,
}: Props) {
  return (
    <ScrollArea className="pb-4 whitespace-nowrap w-full">
      <div className="flex w-max space-x-2 px-4">
        {allDivisions.map((division) => {
          const isActive = division === selectedDivision;
          return (
            <Badge
              variant={"outline"}
              key={division}
              onClick={() => setSelectedDivision(division)}
              className={cn(
                "cursor-pointer text-white",
                isActive && "cursor-default bg-white text-black",
              )}
            >
              {division}
            </Badge>
          );
        })}
      </div>

      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
