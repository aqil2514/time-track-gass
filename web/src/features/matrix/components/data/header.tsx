interface Props {
  hours: string[];
}
export function MatrixHeader({ hours }: Props) {
  return (
    <div className="flex items-center mb-6 border-b border-slate-800/50 pb-4">
      <div className="w-40 shrink-0 uppercase tracking-[0.2em] text-[10px] font-bold text-slate-500">
        Tim / Durasi Aktif
      </div>
      <div className="flex gap-1.5 w-full justify-between px-2">
        {hours.map((hour) => (
          <div
            key={hour}
            className="w-full text-center text-[10px] text-slate-300 font-medium"
          >
            {hour}
          </div>
        ))}
      </div>
    </div>
  );
}
