import { LoadingSpinner } from "../atoms/loading-spinner";

export function Loading() {
  return (
    <div className="w-full h-screen bg-slate-950 flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}
