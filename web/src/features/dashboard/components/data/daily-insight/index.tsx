import { LoadingSpinner } from "@/components/atoms/loading-spinner";
import { webUrl } from "@/constants/server-url";
import { DailySummaryDb } from "@/features/dashboard/interface/daily-summary.interface";
import { useFetch } from "@/hooks/use-fetch";
import { useQueryParams } from "@/hooks/use-query-params";
import { buildUrl } from "@/utils/build-url";
import { isToday } from "date-fns";
import React from "react";
import { BsStars } from "react-icons/bs";

export function AIDailyInsight() {
  const { get } = useQueryParams();

  const date = get("date");
  const user = get("user");

  const isCanFetch = !!date && !!user;

  const url = isCanFetch
    ? buildUrl("api/user-daily-insight", webUrl, {
        date,
        user,
      })
    : null;

  const { data, isLoading } = useFetch<DailySummaryDb>(url, {
    keepPreviousData: false,
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BsStars className="text-purple-400" />
        <h3 className="text-white font-semibold tracking-tight">
          AI Daily Insight
        </h3>
      </div>

      {/* Card */}
      {isLoading ? <LoadingSpinner /> : <DataRender data={data} />}
    </div>
  );
}

const DataRender: React.FC<{ data: DailySummaryDb | undefined }> = ({
  data,
}) => {
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
};

function highlightText(text: string, highlights: string[]) {
  if (!highlights.length) return text;

  const regex = new RegExp(`(${highlights.join("|")})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, index) =>
    highlights.some((word) => word.toLowerCase() === part.toLowerCase()) ? (
      <span key={index} className="text-purple-400 font-medium">
        {part}
      </span>
    ) : (
      part
    ),
  );
}
