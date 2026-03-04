import { useHomeContext } from "@/routes/home/store/home.provider";
import { ActivityType } from "@/routes/home/types/ai-record.type";

export function ActivityBreakdown() {
  const { fetcher } = useHomeContext();
  const { data, isLoading, error } = fetcher;

  // 🔹 Loading state
  if (isLoading) return <p className="text-slate-400">Loading...</p>;

  // 🔹 Error or no data
  if (error || !data || data.length === 0)
    return (
      <div>
        <h3 className="text-white font-semibold tracking-tight">
          Activity Breakdown
        </h3>
        <p className="text-slate-400">No activity data available</p>
      </div>
    );

  // 🔹 Total activity count
  const total = data.length;

  const items = data.flatMap((d) => d.items);

  // 🔹 Group activities by category
  const grouped = items.reduce<Record<ActivityType, number>>(
    (acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    },
    {} as Record<ActivityType, number>,
  );

  // 🔹 Convert grouped object to array and sort by count descending
  const breakdown = Object.entries(grouped)
    .map(([category, count]) => ({
      category: category as ActivityType,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3); // Take top 3 categories

  return (
    <div className="space-y-5">
      <h3 className="text-white font-semibold tracking-tight">
        Activity Breakdown
      </h3>

      <div className="space-y-4">
        {breakdown.map((item) => (
          <div key={item.category} className="space-y-2">
            {/* Label */}
            <div className="flex justify-between text-sm">
              <span className="capitalize text-slate-300">{item.category}</span>
              <span className="text-slate-400">{item.percentage}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}

        {/* Optional: Show message if less than 3 categories */}
        {breakdown.length < 3 && (
          <p className="text-slate-400 text-sm">No more activity categories</p>
        )}
      </div>
    </div>
  );
}
