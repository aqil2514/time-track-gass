import { LoadingSpinner } from "@/components/atoms/loading-spinner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useActivity } from "@/features/activity/provider/activity.provider";
import { AIScreenReportDb } from "@/features/dashboard/interface/ai-screen-db.interface";
import { ActivityData } from "@/features/dashboard/interface/acivity-data.interface";
import { useDashboardContext } from "@/features/dashboard/provider/dashboard.provider";
import { cn } from "@/lib/utils";
import { differenceInMinutes, format, isSameDay } from "date-fns";
import { ChevronUp, Eye } from "lucide-react";
import React, { useState } from "react";
import { BsStars } from "react-icons/bs";

function buildDurationText(start: Date, end: Date): string {
  const totalMinutes = differenceInMinutes(end, start);
  if (totalMinutes >= 60) return `(${Math.floor(totalMinutes / 60)}h)`;
  return `(${totalMinutes}m)`;
}

function groupByDate(items: ActivityData[]): Array<{ dateLabel: string; items: ActivityData[] }> {
  const map = new Map<string, ActivityData[]>();
  for (const item of items) {
    const key = format(new Date(item.session_start), "yyyy-MM-dd");
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries()).map(([key, items]) => ({
    dateLabel: format(new Date(key), "EEEE, dd MMM yyyy"),
    items,
  }));
}

function SessionItem({
  item,
  accordionValue,
  setAccordionValue,
}: {
  item: ActivityData;
  accordionValue: string;
  setAccordionValue: (v: string) => void;
}) {
  const start = new Date(item.session_start);
  const end = new Date(item.session_end);
  const isActive = accordionValue === item.id;

  return (
    <AccordionItem
      className="bg-slate-900 px-4 rounded-2xl relative group border-slate-700 border"
      value={item.id}
    >
      <div className="absolute -left-10 top-0">
        <div className="flex gap-1 items-center">
          <p className="text-xs text-muted-foreground font-bold">
            {format(start, "HH:mm")}
          </p>
          <div className="size-4 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/40">
            <div className="size-2 rounded-full bg-purple-500 group-hover:scale-110 transition-transform duration-200" />
          </div>
        </div>
      </div>
      <AccordionTrigger className="cursor-pointer" defaultChevron={false}>
        <>
          <div className="space-y-2">
            <div className="flex items-start gap-1">
              <Badge className="bg-purple-500 text-white">{item.categories}</Badge>
              <p className="line-clamp-1">{item.title}</p>
            </div>
            <p className="text-sm text-muted-foreground font-semibold">
              {format(start, "HH:mm a")} - {format(end, "HH:mm a")} {buildDurationText(start, end)}
            </p>
          </div>
          <div className="bg-purple-400 text-purple-950 font-bold rounded-sm">
            <ChevronUp className={cn("duration-200 transition", isActive && "rotate-180")} />
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
}

export function TimelineItems() {
  const { data, isLoading, isLoadingMore, hasMore, loadMore } = useDashboardContext();
  const [accordionValue, setAccordionValue] = useState("");

  if (isLoading) return <LoadingSpinner />;

  if (!data || data.length === 0)
    return (
      <div className="flex items-center justify-center h-96 text-slate-400 text-sm">
        No activity yet
      </div>
    );

  const isMultiDay =
    data.length > 1 &&
    !isSameDay(new Date(data[0].session_start), new Date(data[data.length - 1].session_start));

  const loadMoreButton = hasMore && (
    <div className="flex justify-center pt-4 pb-2">
      <Button
        variant="ghost"
        size="sm"
        className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs"
        onClick={loadMore}
        disabled={isLoadingMore}
      >
        {isLoadingMore ? "Memuat..." : "Muat lebih banyak"}
      </Button>
    </div>
  );

  if (isMultiDay) {
    const groups = groupByDate(data);
    return (
      <ScrollArea className="h-screen pr-4">
        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.dateLabel}>
              <div className="mb-3 flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-purple-400">
                  {group.dateLabel}
                </span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>
              <div className="relative pl-10">
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-linear-to-b from-purple-500/40 via-purple-500/20 to-transparent rounded-full" />
                <Accordion
                  value={accordionValue}
                  onValueChange={setAccordionValue}
                  type="single"
                  collapsible
                  className="space-y-6"
                >
                  {group.items.map((item) => (
                    <SessionItem
                      key={item.id}
                      item={item}
                      accordionValue={accordionValue}
                      setAccordionValue={setAccordionValue}
                    />
                  ))}
                </Accordion>
              </div>
            </div>
          ))}
        </div>
        {loadMoreButton}
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-screen pr-4">
      <div className="relative pl-10">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-linear-to-b from-purple-500/40 via-purple-500/20 to-transparent rounded-full" />
        <Accordion
          value={accordionValue}
          onValueChange={setAccordionValue}
          type="single"
          collapsible
          className="space-y-6"
        >
          {data.map((item) => (
            <SessionItem
              key={item.id}
              item={item}
              accordionValue={accordionValue}
              setAccordionValue={setAccordionValue}
            />
          ))}
        </Accordion>
      </div>
      {loadMoreButton}
    </ScrollArea>
  );
}

const ItemList: React.FC<{ item: AIScreenReportDb }> = ({ item }) => {
  const { dispatch } = useActivity();
  return (
    <div key={item.id}>
      <div className="flex">
        <p className="text-sm text-muted-foreground font-semibold">
          {format(item.created_at, "HH:mm")}
        </p>

        <div className="ml-8 bg-slate-800/70 backdrop-blur-sm border border-slate-700 hover:border-purple-500/40 transition-all duration-300 p-4 rounded-2xl shadow-md hover:shadow-purple-500/10">
          <div className="flex gap-4 items-center">
            <Button
              variant={"ghost"}
              size={"icon-xs"}
              onClick={() =>
                dispatch({
                  type: "UPDATE_OPENED_MODAL",
                  payload: { state: "detail", activityId: item.id },
                })
              }
            >
              <Eye />
            </Button>
            <p className="text-sm font-semibold text-white tracking-tight">
              {item.app_name}
            </p>
          </div>

          <div className="flex gap-2 mt-2 text-xs text-slate-400 leading-relaxed">
            <BsStars className="text-purple-400 mt-0.5 animate-pulse" />
            <p className="flex-1">{item.summary}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
