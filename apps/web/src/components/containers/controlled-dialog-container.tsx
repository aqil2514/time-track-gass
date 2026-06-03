import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

export function ControlledDialogContainer({
  onOpenChange,
  open,
  description,
  title,
  children,
  className,
}: Props) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className={cn(
          "bg-slate-900 border-slate-800 sm:max-w-125 shadow-2xl",
          className,
        )}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-bold text-slate-100 tracking-tight">
            {title}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-sm leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 text-slate-200">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
