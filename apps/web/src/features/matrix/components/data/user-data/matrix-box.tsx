import React, { forwardRef } from "react";
import { cn } from "@/lib/utils"; // Gunakan utility classnames jika ada

export interface MatrixBoxConfig {
  intensity: number;
  isWorkSessionStart?: boolean;
  isWorkSessionEnd?: boolean;
  isHaveAdjustment?: boolean;
}

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  config: MatrixBoxConfig;
}

const WorkSessionStart = () => (
  <div className="absolute left-0 top-0 bottom-0 w-0.75 bg-emerald-400 shadow-[2px_0_8px_rgba(52,211,153,0.6)]" />
);

const WorkSessionEnd = () => (
  <div className="absolute right-0 top-0 bottom-0 w-0.75 bg-rose-400 shadow-[-2px_0_8px_rgba(251,113,133,0.6)]" />
);

const AdjustmentIndicator = () => (
  <div className="absolute top-1 right-1 flex space-x-0.5">
    <div className="size-1.5 rounded-full bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.8)] animate-pulse" />
  </div>
);

export const MatrixBox = forwardRef<HTMLDivElement, Props>(
  ({ config, className, ...props }, ref) => {
    const {
      intensity,
      isWorkSessionStart,
      isWorkSessionEnd,
      isHaveAdjustment,
    } = config;

    return (
      <div
        {...props}
        ref={ref}
        className={cn(
          "relative w-full h-9 rounded-md transition-all duration-300 border border-white/5 cursor-help overflow-hidden",
          // Efek Border Glow jika intensitas tinggi
          intensity > 10 && "border-purple-500/30",
          className,
        )}
        style={{
          backgroundColor:
            intensity === 0
              ? "#060b18"
              : `rgba(168, 85, 247, ${intensity / 12})`,
          boxShadow:
            intensity > 8
              ? `inset 0 0 10px rgba(168, 85, 247, ${intensity / 30}), 0 0 ${intensity * 1.2}px rgba(168, 85, 247, ${intensity / 25})`
              : "none",
          ...props.style,
        }}
      >
        {isWorkSessionStart && <WorkSessionStart />}

        {/* 2. Desain untuk WORK SESSION END (Garis Kanan Terang) */}
        {isWorkSessionEnd && <WorkSessionEnd />}

        {/* 3. Desain untuk ADJUSTMENT (Indikator Titik di Pojok) */}
        {isHaveAdjustment && <AdjustmentIndicator />}

        {/* Overlay subtle untuk tekstur jika ada aktivitas */}
        {intensity > 0 && (
          <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent pointer-events-none" />
        )}
      </div>
    );
  },
);

MatrixBox.displayName = "MatrixBox";
