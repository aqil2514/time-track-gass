"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { TimePickerInput } from "./time-picker-input";

type TimePickerPart = "hours" | "minutes" | "seconds";

interface TimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  disabled?: boolean;
  show?: TimePickerPart[];
}

export function TimePicker({
  date,
  setDate,
  disabled,
  show = ["hours", "minutes", "seconds"],
}: TimePickerProps) {
  const minuteRef = React.useRef<HTMLInputElement>(null);
  const hourRef = React.useRef<HTMLInputElement>(null);
  const secondRef = React.useRef<HTMLInputElement>(null);

  const refMap: Record<
    TimePickerPart,
    React.RefObject<HTMLInputElement | null>
  > = {
    hours: hourRef,
    minutes: minuteRef,
    seconds: secondRef,
  };

  const nextRef = (current: TimePickerPart): (() => void) | undefined => {
    const order: TimePickerPart[] = ["hours", "minutes", "seconds"];
    const visibleAfter = order
      .slice(order.indexOf(current) + 1)
      .filter((p) => show.includes(p));
    const next = visibleAfter[0];
    return next ? () => refMap[next].current?.focus() : undefined;
  };

  const prevRef = (current: TimePickerPart): (() => void) | undefined => {
    const order: TimePickerPart[] = ["hours", "minutes", "seconds"];
    const visibleBefore = order
      .slice(0, order.indexOf(current))
      .filter((p) => show.includes(p));
    const prev = visibleBefore.at(-1);
    return prev ? () => refMap[prev].current?.focus() : undefined;
  };

  const parts: TimePickerPart[] = ["hours", "minutes", "seconds"];

  const partLabel:Record<TimePickerPart, string> = {
    hours:"Jam",
    minutes:"Menit",
    seconds:"Detik"
  }

  return (
    <div className="flex items-end gap-2">
      {parts
        .filter((part) => show.includes(part))
        .map((part) => (
          <div key={part} className="grid gap-1 text-center space-y-2">
            <Label htmlFor={part} className="text-xs capitalize">
              {partLabel[part]}
            </Label>
            <TimePickerInput
              picker={part}
              date={date}
              setDate={setDate}
              disabled={disabled}
              ref={refMap[part]}
              onRightFocus={nextRef(part)}
              onLeftFocus={prevRef(part)}
            />
          </div>
        ))}
      <div className="flex h-10 items-center">
        <Clock className="ml-2 h-4 w-4" />
      </div>
    </div>
  );
}
