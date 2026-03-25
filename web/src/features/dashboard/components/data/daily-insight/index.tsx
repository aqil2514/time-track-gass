import { BsStars } from "react-icons/bs";
import { SummaryMode } from "./summary-mode";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TRIGGER_STYLE =
  "px-8 h-full rounded-md font-medium transition-all duration-300 text-zinc-400 bg-transparent data-[state=active]:bg-purple-600/20  data-[state=active]:text-purple-300  data-[state=active]:border-purple-500/50  border border-transparent hover:text-zinc-200 hover:bg-white/5";

export function AIDailyInsight() {
  const [dailyMode, setDailyMode] = useState<string>("summary");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BsStars className="text-purple-400" />
        <h3 className="text-white font-semibold tracking-tight">
          AI Daily Insight
        </h3>
      </div>

      <Tabs value={dailyMode} onValueChange={setDailyMode} className="w-full">
        <TabsList className="bg-zinc-900/50 border border-white/10 p-1 h-12 gap-2">
          <TabsTrigger value="summary" className={TRIGGER_STYLE}>
            Summary
          </TabsTrigger>

          <TabsTrigger value="detail" className={TRIGGER_STYLE}>
            Detail
          </TabsTrigger>
        </TabsList>
        <TabsContent value="summary">
          <SummaryMode />
        </TabsContent>
        <TabsContent value="detail">Change your password here.</TabsContent>
      </Tabs>
    </div>
  );
}
