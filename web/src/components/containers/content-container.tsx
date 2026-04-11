import React from "react";
import { cn } from "@/lib/utils";

interface ContentContainerProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  rightElement?: React.ReactNode;
}

export function ContentContainer({
  children,
  title,
  description,
  className,
  rightElement,
}: ContentContainerProps) {
  return (
    <div
      className={cn(
        "w-full rounded-xl border border-slate-700 bg-slate-800/50 p-6 shadow-sm",
        className,
      )}
    >
      {/* Header Area */}
      {(title || description || rightElement) && (
        <div className="flex items-center justify-between mb-6">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-slate-100 leading-none mb-1">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-slate-400">{description}</p>
            )}
          </div>
          {rightElement && <div>{rightElement}</div>}
        </div>
      )}

      {/* Main Content */}
      <div className="relative">{children}</div>
    </div>
  );
}
