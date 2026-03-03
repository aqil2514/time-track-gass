import { BsStars } from "react-icons/bs";

interface InsightData {
  summary: string;
  highlights: string[];
  productivity: {
    title: string;
    description: string;
  };
}

const dummyInsightData: InsightData = {
  summary:
    "Alice focused on auth module in the morning, continued with payment API after lunch. Fixed 1 validation bug and reviewed cache PR.",
  highlights: ["auth module", "payment API"],
  productivity: {
    title: "Productivity:",
    description:
      "5.5h coding from 6.5h total.",
  },
};

export function AIDailyInsight() {
  const { summary, highlights, productivity } = dummyInsightData;

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
      <div className="ml-8 bg-slate-800/80 border border-slate-700 hover:border-purple-500/40 transition-colors duration-300 p-5 rounded-2xl shadow-sm space-y-5">
        {/* Summary */}
        <p className="text-sm text-slate-300 leading-relaxed">
          {highlightText(summary, highlights)}
        </p>

        {/* Productivity Box */}
        <div className="bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3">
          <span className="text-purple-400 font-semibold">
            {productivity.title}
          </span>{" "}
          <span className="text-slate-300">{productivity.description}</span>
        </div>
      </div>
    </div>
  );
}

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
