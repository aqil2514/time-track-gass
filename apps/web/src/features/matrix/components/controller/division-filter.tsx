"use client";

import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useDivisions } from "@/features/divisions/hooks/use-divisions";
import { useQueryParams } from "@/hooks/use-query-params";
import { cn } from "@/lib/utils";

const GENERAL_DATA_ID = 8;

export function MatrixDivisionFilter() {
  const { data: divisions } = useDivisions();
  const { get, set, remove } = useQueryParams();
  const selectedDivision = get("division");

  const handleSelect = (division: string) => {
    set("division", division);
  };

  return (
    <ScrollArea className="pb-4 whitespace-nowrap w-full">
      <div className="flex w-max space-x-2 px-4">
        <Badge
          variant="outline"
          onClick={() => remove("division")}
          className={cn(
            "cursor-pointer text-white",
            !selectedDivision && "cursor-default bg-white text-black",
          )}
        >
          Semua
        </Badge>

        {divisions.filter((division) => division.id !== GENERAL_DATA_ID).map((division) => {
          const isActive = division.name === selectedDivision;

          return (
            <Badge
              variant="outline"
              key={division.id}
              onClick={() => handleSelect(division.name)}
              className={cn(
                "cursor-pointer text-white",
                isActive && "cursor-default bg-white text-black",
              )}
            >
              {division.name}
            </Badge>
          );
        })}
      </div>

      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
