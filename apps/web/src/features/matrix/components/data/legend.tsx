export function MatrixLegend() {
  return (
    <div className="mt-6 flex gap-6 items-center text-[10px] uppercase tracking-[0.15em] text-slate-500 font-bold">
      <span>Intensity:</span>
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#060b18] border border-slate-800 rounded-sm" />
          <span className="text-slate-600">Off</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-400 shadow-[0_0_8px_rgba(168, 85, 247, 0.6)] rounded-sm" />
          <span className="text-slate-300">High Activity</span>
        </div>
      </div>
    </div>
  );
}
