import { LoadingSpinner } from "@/components/atoms/loading-spinner";
import { Accordion } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useHomeContext } from "@/routes/home/store/home.provider";
import { useState } from "react";
import { ActivityDataItem } from "./activity-data";

export function TimelineItems() {
  const { fetcher } = useHomeContext();
  const { data, isLoading } = fetcher;
  const [accordionValue, setAccordionValue] = useState("");

  if (isLoading) return <LoadingSpinner />;

  // Handle empty data
  if (!data || data?.activityData.length === 0)
    return (
      <div className="flex items-center justify-center h-96 text-slate-400 text-sm">
        No activity yet
      </div>
    );

  return (
    <ScrollArea className="h-screen pr-4">
      <div className="relative pl-10">
        {/* Vertical Gradient Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-linear-to-b from-purple-500/40 via-purple-500/20 to-transparent rounded-full" />

        <Accordion
          value={accordionValue}
          onValueChange={setAccordionValue}
          type="single"
          collapsible
          className="space-y-6"
        >
          {data.activityData.map((item) => (
            <ActivityDataItem
              key={item.id}
              item={item}
              accordionValue={accordionValue}
            />
          ))}
        </Accordion>
      </div>
    </ScrollArea>
  );
}
