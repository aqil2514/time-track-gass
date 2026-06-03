import { LoadingSpinner } from "@/components/atoms/loading-spinner";
import { useDetailMode } from "./logics";
import { DailySummaryPerCategory } from "@/features/dashboard/interface/daily-summary-percategory.interface";
import { isToday } from "date-fns";
import { useQueryParams } from "@/hooks/use-query-params";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Clock, MessageSquareText } from "lucide-react";

export function DetailMode() {
  const { data, isLoading } = useDetailMode();

  return isLoading ? <LoadingSpinner /> : <InnerTemplate data={data} />;
}

const InnerTemplate = ({
  data,
}: {
  data: DailySummaryPerCategory[] | undefined;
}) => {
  const { get } = useQueryParams();

  const dateParam = get("date");
  if (!dateParam) return null;

  // Cek apakah tanggal hari ini
  if (isToday(new Date(dateParam)))
    return (
      <div className="flex items-center gap-3 p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
        <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
        <p className="text-zinc-400 text-sm italic">
          Daily Insight for today is being processed by AI...
        </p>
      </div>
    );

  if (!data || data.length === 0)
    return (
      <div className="p-8 border border-dashed border-zinc-800 rounded-xl text-center">
        <p className="text-sm text-zinc-500 leading-relaxed font-medium">
          No detailed activities found for this date.
        </p>
      </div>
    );

  return (
    <div className="relative group">
      <Carousel className="w-full max-w-2xl mx-auto">
        <CarouselContent>
          {data.map((item) => (
            <CarouselItem key={item.id}>
              <div className="ml-8 bg-slate-800/80 border border-slate-700 hover:border-purple-500/40 transition-colors duration-300 p-5 rounded-2xl shadow-sm space-y-5">
                
                {/* Header: Category & Duration */}
                <div className="flex items-start justify-between mb-4">
                  <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20 capitalize px-3 py-1">
                    {item.category.replace('_', ' ')}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-zinc-500 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{item.duration} min</span>
                  </div>
                </div>

                {/* Content: Summary */}
                <div className="flex gap-3 items-start">
                  <MessageSquareText className="w-5 h-5 text-zinc-600 mt-1 shrink-0" />
                  <p className="text-zinc-300 leading-relaxed text-[15px] font-medium italic">
                    &quot;{item.summary}&quot;
                  </p>
                </div>

                {/* Footer: User ID / Info Tambahan */}
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                   <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
                     AI Analysis Report
                   </span>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Tombol Navigasi yang Hanya Muncul saat Hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <CarouselPrevious className="-left-12 bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white" />
          <CarouselNext className="-right-12 bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white" />
        </div>
      </Carousel>

      {/* Indicator Counter sederhana di bawah */}
      <p className="text-center text-[10px] text-zinc-500 mt-4 uppercase tracking-tighter">
        Slide to see more categories
      </p>
    </div>
  );
};