import { Skeleton } from "@/components/ui/skeleton";

export function DetailDialogLoading() {
  return (
    <div className="space-y-6 p-4">
      <Skeleton className="h-20 w-full bg-slate-800" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-64 bg-slate-800" />
        <Skeleton className="h-64 bg-slate-800" />
      </div>
    </div>
  );
}
