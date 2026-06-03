interface Props {
  hours: string[];
}

export function MatrixHeader({ hours }: Props) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center mb-6 border-b border-slate-800/50 pb-4 gap-4 md:gap-6">
      
      <div className="hidden md:block w-44 shrink-0 uppercase tracking-[0.2em] text-[10px] font-bold text-slate-500">
        Tim / Durasi Aktif
      </div>

      <div className="w-full overflow-x-auto no-scrollbar">
        <div className="flex gap-1 md:gap-1.5 w-full justify-between px-2 min-w-150 md:min-w-0">
          {hours.map((hour) => (
            <div
              key={hour}
              className="flex-1 text-center text-[10px] text-slate-500 font-medium font-mono"
            >
              {hour}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}