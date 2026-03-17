import { LoadingSpinner } from "@/components/atoms/loading-spinner";
import { BsStars } from "react-icons/bs";
import { DataRender } from "./data-render";
import { useDailyInsight } from "./logics";

export function AIDailyInsight() {
  const { data, isLoading } = useDailyInsight();

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
