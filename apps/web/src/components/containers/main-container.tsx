import { cn } from "@/lib/utils";
import React, { HTMLAttributes } from "react";

interface MainContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function MainContainer({
  children,
  className,
  ...props
}: MainContainerProps) {
  return (
    <div className={cn("text-white p-4", className)} {...props}>
      {children}
    </div>
  );
}
