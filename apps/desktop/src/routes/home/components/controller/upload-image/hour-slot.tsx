import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useHomeContext } from "@/routes/home/store/home.provider";
import { isBefore, isToday, startOfDay } from "date-fns";
import { Clock } from "lucide-react";
import React, { useMemo } from "react";

interface Props {
  selectedSlot: number | null;
  setSelectedSlot: React.Dispatch<React.SetStateAction<number | null>>;
}

export function HourSlot({ selectedSlot, setSelectedSlot }: Props) {
  const {
    fetcher: { date },
  } = useHomeContext();
  const now = new Date();
  const currentHour = now.getHours();

  const selectedDate = date || new Date();

  const slots = useMemo(() => {
    const today = startOfDay(new Date());
    const viewingDate = startOfDay(selectedDate);

    const isSelectedPast = isBefore(viewingDate, today);
    const isSelectedToday = isToday(viewingDate);

    return Array.from({ length: 24 }, (_, i) => {
      const start = i;

      const isOpen = isSelectedPast || (isSelectedToday && start < currentHour);

      return {
        id: i,
        label: `${i.toString().padStart(2, "0")} s/d ${(i + 1).toString().padStart(2, "0")}`,
        isOpen,
      };
    });
  }, [currentHour, selectedDate]);

  return (
    <div className="flex flex-col h-125 border-r border-slate-800 pr-4">
      <div className="flex items-center gap-2 mb-4 px-2">
        <Clock className="h-4 w-4 text-purple-400" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Available Slots
        </span>
      </div>

      <ScrollArea className="flex-1 pr-4 h-96">
        <div className="space-y-2">
          {slots.map((slot) => (
            <button
              key={slot.id}
              disabled={!slot.isOpen}
              onClick={() => setSelectedSlot(slot.id)}
              className={cn(
                "w-full text-left px-3 py-3 rounded-lg text-[11px] font-medium transition-all border",
                // State: Locked
                !slot.isOpen &&
                  "opacity-30 cursor-not-allowed bg-slate-900 border-transparent text-slate-600",
                // State: Open (Belum dipilih)
                slot.isOpen &&
                  selectedSlot !== slot.id &&
                  "bg-slate-900/50 border-slate-800 text-slate-300 hover:border-purple-500/50 hover:bg-slate-800",
                // State: Active/Selected
                selectedSlot === slot.id &&
                  "bg-purple-600 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]",
              )}
            >
              <div className="flex items-center justify-between">
                <span>{slot.label}</span>
                {selectedSlot === slot.id && (
                  <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                )}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>

      <div className="mt-4 pt-4 border-t border-slate-800 text-[10px] text-slate-500 italic px-2">
        * Slot otomatis terbuka setelah jam berlalu.
      </div>
    </div>
  );
}
