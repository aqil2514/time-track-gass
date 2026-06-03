import { DailySummaryDb } from "@/features/dashboard/interface/daily-summary.interface";
import { highlightText } from "@/features/dashboard/utils/highlight-text";
import { useQueryParams } from "@/hooks/use-query-params";
import { isToday } from "date-fns";
import { useSummaryMode } from "./logics";
import { LoadingSpinner } from "@/components/atoms/loading-spinner";

export function SummaryMode() {
   const { data, isLoading } = useSummaryMode();

   return isLoading ? <LoadingSpinner /> : <InnerTemplate data={data} />
}

const InnerTemplate = ({ data }: { data: DailySummaryDb | undefined }) => {
  const { get } = useQueryParams();

  const date = get("date");
  if (!date) return null;

  if (isToday(date))
    return (
      <p className="text-slate-400 italic">
        Daily summary for today is being processed...
      </p>
    );

  if (!data)
    return (
      <p className="text-sm text-slate-400 leading-relaxed">Data not found</p>
    );

  const { productivity_description, summary, highlights } = data;
  return (
    <div className="ml-8 bg-slate-800/80 border border-slate-700 hover:border-purple-500/40 transition-colors duration-300 p-5 rounded-2xl shadow-sm space-y-5">
      {/* Summary */}
      <p className="text-sm text-slate-300 leading-relaxed">
        {highlightText(summary, highlights)}
      </p>

      {/* Productivity Box */}
      <div className="bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3">
        <span className="text-purple-400 font-semibold">Productivity</span>{" "}
        <span className="text-slate-300">{productivity_description}</span>
      </div>
    </div>
  );
}