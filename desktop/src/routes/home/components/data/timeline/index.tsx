import React, { useState } from "react";
import { TimelineItems } from "./category/items";
import { TimelineTitle } from "./title";
import { SessionTimeline } from "./session";
import { useUserSetting } from "@/hooks/use-user-settings";
import { LoadingSpinner } from "@/components/atoms/loading-spinner"; // Import spinner
import { AlertCircle } from "lucide-react"; // Import icon error

export function DataTimeline() {
  const { data, isLoading, error } = useUserSetting();

  const [mode, setMode] = useState<"session" | "category">("session");
  const isAutoMode = data?.tracker.mode === "auto";

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-800 rounded-3xl">
        <LoadingSpinner />
        <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest">
          Checking tracker settings...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border border-red-500/20 bg-red-500/5 rounded-3xl">
        <AlertCircle className="w-5 h-5 text-red-500/50 mb-2" />
        <p className="text-xs text-red-400 font-medium">
          Gagal memuat konfigurasi
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TimelineTitle mode={mode} onModeChange={setMode} isAutoMode={isAutoMode} />
      <FlexRender mode={mode} isAutoMode={isAutoMode} />
    </div>
  );
}

const FlexRender: React.FC<{
  mode: "session" | "category";
  isAutoMode: boolean;
}> = ({ mode, isAutoMode }) => {
  if (!isAutoMode) return <TimelineItems />;

  switch (mode) {
    case "session":
      return <SessionTimeline />;
    case "category":
      return <TimelineItems />;
    default:
      return null;
  }
};
