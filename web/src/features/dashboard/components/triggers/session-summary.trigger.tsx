"use client";

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Clock } from "lucide-react";
import { useState } from "react";
import { buildUrl } from "@/utils/build-url";
import { api } from "@/lib/api";

export function SessionSummaryTriggerPopover() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async () => {
    if (!from || !to) return;

    setIsLoading(true);
    setMessage(null);

    try {
      await api.post(buildUrl("supervisor/trigger/session-summary"), {
        from,
        to,
      });
      setMessage({ type: "success", text: "Session summary generated successfully!" });
      setFrom("");
      setTo("");
    } catch {
      setMessage({ type: "error", text: "Failed to generate session summary." });
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = !from || !to || isLoading;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="cursor-pointer border border-gray-600 bg-gray-800/80 hover:bg-gray-700 transition rounded-lg px-3 py-2 shadow-sm">
          <div className="flex items-center gap-2">
            <RefreshCcw className="size-4 text-purple-400" />
            <span className="text-white text-sm font-medium">
              Generate Session Summary
            </span>
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent className="bg-gray-800 border border-gray-600 w-[320px] space-y-4 p-4">
        <PopoverHeader>
          <PopoverTitle className="text-white flex items-center gap-2">
            <Clock className="size-4 text-purple-400" />
            Session Summary
          </PopoverTitle>
          <PopoverDescription className="text-gray-400">
            Manually trigger session summary generation for a specific time range.
          </PopoverDescription>
        </PopoverHeader>

        <Separator className="bg-gray-700" />

        {/* From */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">
            From
          </label>
          <input
            type="datetime-local"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setMessage(null);
            }}
            className="w-full rounded-md bg-gray-700 border border-gray-600 px-3 py-2 text-sm text-white outline-none focus:border-purple-500 transition scheme-dark"
          />
        </div>

        {/* To */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">
            To
          </label>
          <input
            type="datetime-local"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setMessage(null);
            }}
            className="w-full rounded-md bg-gray-700 border border-gray-600 px-3 py-2 text-sm text-white outline-none focus:border-purple-500 transition scheme-dark"
          />
        </div>

        <Separator className="bg-gray-700" />

        {/* Feedback message */}
        {message && (
          <p
            className={`text-xs text-center font-medium ${
              message.type === "success" ? "text-purple-400" : "text-red-400"
            }`}
          >
            {message.text}
          </p>
        )}

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={isDisabled}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <RefreshCcw className="size-4 animate-spin" />
              <span>Generating...</span>
            </div>
          ) : (
            "Generate"
          )}
        </Button>
      </PopoverContent>
    </Popover>
  );
}