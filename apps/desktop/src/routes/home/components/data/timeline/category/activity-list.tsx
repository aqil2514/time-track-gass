import { AIScreenReportDb } from "@/routes/home/types/ai-record.type";
import { format } from "date-fns";
import { BsStars } from "react-icons/bs";

interface Props {
  item: AIScreenReportDb;
}

export function ActivityList({ item }: Props) {
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
}
