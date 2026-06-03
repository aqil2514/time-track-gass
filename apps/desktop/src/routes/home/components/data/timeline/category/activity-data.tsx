import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ActivityData } from "@/routes/home/types/activites-data.type";
import { differenceInMinutes, format } from "date-fns";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActivityList } from "./activity-list";

interface Props {
  item: ActivityData;
  accordionValue: string;
}

export function ActivityDataItem({ item, accordionValue }: Props) {
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
      <AccordionTrigger className="cursor-pointer" defaultChevron={false}>
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
          <div className="bg-purple-400 text-purple-950 font-bold rounded-sm">
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
          <ActivityList item={list} key={list.id} />
        ))}
      </AccordionContent>
    </AccordionItem>
  );
}
