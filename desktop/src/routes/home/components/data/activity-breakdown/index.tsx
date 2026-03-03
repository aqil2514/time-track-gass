import { useHomeContext } from "@/routes/home/store/home.provider";
import { ActivityType } from "@/routes/home/types/ai-record.type";

export function ActivityBreakdown() {
  const { fetcher } = useHomeContext();
  const { data, isLoading, error } = fetcher;

  if (isLoading) return <p className="text-slate-400">Loading...</p>;
  if (error || !data) return null;

  // 🔹 Hitung total activity
  const total = data.length;

  // 🔹 Grouping berdasarkan category
  const grouped = data.reduce<Record<ActivityType, number>>(
    (acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    },
    {} as Record<ActivityType, number>
  );

  // 🔹 Convert ke array supaya bisa di-map
  const breakdown = Object.entries(grouped)
    .map(([category, count]) => ({
      category: category as ActivityType,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count).splice(0, 3);

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
              <span className="capitalize text-slate-300">
                {item.category}
              </span>
              <span className="text-slate-400">
                {item.percentage}%
              </span>
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
      </div>
    </div>
  );
}