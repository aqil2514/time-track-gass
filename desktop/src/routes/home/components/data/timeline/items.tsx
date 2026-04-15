import { LoadingSpinner } from "@/components/atoms/loading-spinner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useHomeContext } from "@/routes/home/store/home.provider";
import { AIScreenReportDb } from "@/routes/home/types/ai-record.type";
import { differenceInMinutes, format } from "date-fns";
import { ChevronUp } from "lucide-react";
import React, { useState } from "react";
import { BsStars } from "react-icons/bs";

export function TimelineItems() {
  const { fetcher } = useHomeContext();
  const { data, isLoading } = fetcher;
  const [accordionValue, setAccordionValue] = useState("");

  if (isLoading) return <LoadingSpinner />;

  // Handle empty data
  if (!data || data.length === 0)
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
          {data.map((item) => {
            const session_start = format(item.session_start, "HH:mm a");
            const session_end = format(item.session_end, "HH:mm a");
            const start = new Date(item.session_start);
            const end = new Date(item.session_end);

            const totalMinutes = differenceInMinutes(end, start);

            let durationText;

            if (totalMinutes >= 60) {
              const hours = Math.floor(totalMinutes / 60);
              durationText = `(${hours}h)`;
            } else {
              durationText = `(${totalMinutes}m)`;
            }

            const isActive = accordionValue === item.id;

            return (
              <AccordionItem
                className="bg-slate-900 px-4 rounded-2xl relative group border-slate-700 border"
                value={item.id}
                key={item.id}
              >
                {/* Bullet */}
                <div className="absolute -left-10 top-0 ">
                  <div className="flex gap-1 items-center">
                    <p className="text-xs text-muted-foreground font-bold">
                      {format(item.session_start, "HH:mm")}
                    </p>
                    <div className="size-4 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/40">
                      <div className="size-2 rounded-full bg-purple-500 group-hover:scale-110 transition-transform duration-200" />
                    </div>
                  </div>
                </div>
                <AccordionTrigger
                  className="cursor-pointer"
                  defaultChevron={false}
                >
                  <>
                    <div className="space-y-2">
                      <div className="flex items-start gap-1">
                        <Badge className="bg-purple-500 text-white">
                          {item.categories}
                        </Badge>
                        <p className="line-clamp-1">{item.title}</p>
                      </div>
                      <p className="text-sm text-muted-foreground font-semibold">
                        {session_start} - {session_end} {durationText}
                      </p>
                    </div>
                    <div
                      className="bg-purple-400 text-purple-950 font-bold rounded-sm"
                    >
                      <ChevronUp
                        className={cn(
                          "duration-200 transition",
                          isActive && "rotate-180 ",
                        )}
                      />
                    </div>
                  </>
                </AccordionTrigger>

                <AccordionContent className="pt-2 space-y-3 h-fit">
                  {item.items.map((list) => (
                    <ItemList item={list} key={list.id} />
                  ))}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </ScrollArea>
  );
}

const ItemList: React.FC<{ item: AIScreenReportDb }> = ({ item }) => {
  return (
    <div key={item.id}>
      <div className="flex">
        <p className="text-sm text-muted-foreground font-semibold">
          {format(item.created_at, "HH:mm")}
        </p>

        <div className="ml-8 bg-slate-800/70 backdrop-blur-sm border border-slate-700 hover:border-purple-500/40 transition-all duration-300 p-4 rounded-2xl shadow-md hover:shadow-purple-500/10">
          <p className="text-sm font-semibold text-white tracking-tight">
            {item.app_name}
          </p>

          <div className="flex gap-2 mt-2 text-xs text-slate-400 leading-relaxed">
            <BsStars className="text-purple-400 mt-0.5 animate-pulse" />
            <p className="flex-1">{item.summary}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
