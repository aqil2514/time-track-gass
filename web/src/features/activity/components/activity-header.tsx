"use client";
import { TitleAndSub } from "@/components/atoms/title-and-sub";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { useActivity } from "../provider/activity.provider";
import { cn } from "@/lib/utils";

export function ActivityHeader() {
  const { data } = useActivity();
  return (
    <div className="flex gap-4 items-center">
      <Button
        onClick={() => data.mutate()}
        disabled={data.isLoading}
        variant="ghost"
        size="icon"
        className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
      >
        <RefreshCcw
          className={cn(
            "w-4 h-4 transition-all duration-500",
            data.isLoading
              ? "animate-spin text-blue-400" // biru saat loading
              : "group-hover:rotate-180 text-slate-400", // rotate saat hover
          )}
        />
      </Button>
      <TitleAndSub title="Aktivitas Tim" sub="Pantau aktivitas tim anda" />
    </div>
  );
}
