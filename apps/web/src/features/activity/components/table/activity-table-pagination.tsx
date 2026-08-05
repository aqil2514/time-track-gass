"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryParams } from "@/hooks/use-query-params";
import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

interface Props {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

const LIMIT_OPTIONS = ["10", "50", "100"];

export function ActivityTablePagination({ page, totalPages, total, limit }: Props) {
  const { set, update } = useQueryParams();
  const [inputValue, setInputValue] = useState(String(page));

  useEffect(() => {
    setInputValue(String(page));
  }, [page]);

  function handlePageBlur() {
    const parsed = parseInt(inputValue, 10);
    if (isNaN(parsed) || parsed < 1) {
      setInputValue(String(page));
      return;
    }
    const clamped = Math.min(parsed, totalPages || 1);
    if (clamped !== page) set("page", String(clamped));
    setInputValue(String(clamped));
  }

  function handleLimitChange(value: string) {
    update({ limit: value, page: "1" });
  }

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const btnClass = "h-7 w-7 text-slate-400 hover:text-slate-200 hover:bg-slate-800";

  return (
    <div className="flex items-center justify-between px-1 pt-3 text-[12px] text-slate-400">
      <span>
        {total === 0 ? "0 records" : `${from}–${to} of ${total.toLocaleString()} records`}
      </span>

      <div className="flex items-center gap-3">
        <Select value={String(limit)} onValueChange={handleLimitChange}>
          <SelectTrigger className="h-7 w-24 border-slate-700 bg-slate-900 text-slate-300 text-[12px] focus:ring-0 focus:ring-offset-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-slate-300 text-[12px]">
            {LIMIT_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt} className="text-[12px]">
                {opt} rows
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className={btnClass} disabled={page <= 1} onClick={() => set("page", "1")}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className={btnClass} disabled={page <= 1} onClick={() => set("page", String(page - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1.5 px-1">
            <span className="text-slate-500">Page</span>
            <input
              type="number"
              min={1}
              max={totalPages || 1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handlePageBlur}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              className="w-10 rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-center text-slate-200 text-[12px] focus:outline-none focus:border-slate-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-slate-500">of {totalPages || 1}</span>
          </div>

          <Button variant="ghost" size="icon" className={btnClass} disabled={page >= totalPages} onClick={() => set("page", String(page + 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className={btnClass} disabled={page >= totalPages} onClick={() => set("page", String(totalPages))}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
