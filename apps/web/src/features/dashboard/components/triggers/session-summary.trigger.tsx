"use client";

import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { useState } from "react";
import axios from "axios";

export function SessionSummaryTrigger() {
  const [isLoading, setIsLoading] = useState(false);

  const handleTrigger = async () => {
    setIsLoading(true);

    try {
      // Kamu bisa sesuaikan payload 'from' & 'to' jika dibutuhkan otomatis
      // Misal: rentang 24 jam terakhir atau biarkan backend yang menentukan
      await axios.post("/api/trigger/session-summary", {
        from: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
        to: new Date().toISOString(),
      });

      alert("Tugas session summary masuk ke dalam antrean!");
    } catch (error) {
      console.error(error);
      alert("Generate session summary gagal.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleTrigger}
      disabled={isLoading}
      variant="outline"
      className="cursor-pointer border-gray-600 bg-gray-800/80 hover:bg-gray-700 text-white gap-2 px-3 py-2 h-auto"
    >
      <RefreshCcw className={`size-4 text-purple-400 ${isLoading ? "animate-spin" : ""}`} />
      <span className="text-sm font-medium">
        {isLoading ? "Generating..." : "Generate Session Summary"}
      </span>
    </Button>
  );
}