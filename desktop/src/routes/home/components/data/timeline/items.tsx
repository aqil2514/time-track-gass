import { LoadingSpinner } from "@/components/atoms/loading-spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useHomeContext } from "@/routes/home/store/home.provider";
import { BsStars } from "react-icons/bs";

export function TimelineItems() {
  const { fetcher } = useHomeContext();
  const { data, isLoading } = fetcher;

  if (isLoading) return <LoadingSpinner />;

  // Handle empty data
  if (!data || data.length === 0)
    return (
      <div className="flex items-center justify-center h-96 text-slate-400 text-sm">
        No activity yet
      </div>
    );

  return (
    <ScrollArea className="h-96 pr-4">
      <div className="relative pl-10">
        {/* Vertical Gradient Line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-linear-to-b from-purple-500/40 via-purple-500/20 to-transparent rounded-full" />

        <div className="space-y-6">
          {data.map((item) => (
            <div className="relative group" key={item.id}>
              {/* Bullet */}
              <div className="absolute left-1.75 top-5 size-4 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/40">
                <div className="size-2 rounded-full bg-purple-500 group-hover:scale-110 transition-transform duration-200" />
              </div>

              {/* Card */}
              <div className="ml-8 bg-slate-800/70 backdrop-blur-sm border border-slate-700 hover:border-purple-500/40 transition-all duration-300 p-4 rounded-2xl shadow-md hover:shadow-purple-500/10">
                {/* App Name */}
                <p className="text-sm font-semibold text-white tracking-tight">
                  {item.app_name}
                </p>

                {/* AI Summary */}
                <div className="flex gap-2 mt-2 text-xs text-slate-400 leading-relaxed">
                  <BsStars className="text-purple-400 mt-0.5 animate-pulse" />
                  <p className="flex-1">{item.summary}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}