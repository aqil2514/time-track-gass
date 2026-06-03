import { UserAttendanceDetail } from "@/features/attendance/interfaces/attendace-logs.interface";
import { formatToTime } from "@/utils/format-to-time";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  BarShapeProps,
  CartesianGrid,
  Rectangle,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  data: UserAttendanceDetail;
}

const RectangleShape = (props: BarShapeProps) => {
  return <Rectangle {...props} fill={"#818cf8"} />;
};

export function DetailDialogChart({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="lg:col-span-7 p-5 rounded-xl bg-slate-800/20 border border-slate-800/60">
      <h4 className="text-sm font-semibold mb-6 text-slate-300">
        Riwayat Jam Kerja
      </h4>
      <div ref={containerRef} className="h-80 w-full">
        {dimensions.width > 0 && (
          // ← Pakai width & height langsung, hapus ResponsiveContainer
          <BarChart
            width={dimensions.width}
            height={dimensions.height}
            data={data.workHourHistory}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#2e334e"
              opacity={0.5}
            />
            <XAxis
              dataKey="work_date"
              tickFormatter={(str) =>
                format(new Date(str), "dd MMM", { locale: id })
              }
              fontSize={11}
              tick={{ fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              fontSize={11}
              tick={{ fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${Math.round(value / 60)}j`}
            />
            <Tooltip
              cursor={{ fill: "#ffffff0a" }}
              contentStyle={{
                backgroundColor: "#1a1b2e",
                border: "1px solid #334155",
                borderRadius: "8px",
              }}
              itemStyle={{ color: "#fff" }}
              labelStyle={{ color: "#94a3b8", marginBottom: "4px" }}
              labelFormatter={(label) =>
                format(new Date(label), "EEEE, dd MMMM", { locale: id })
              }
              formatter={(value) => [
                formatToTime(Number(value), "minutes"),
                "Durasi",
              ]}
            />
            <Bar
              dataKey="duration_minutes"
              radius={[4, 4, 0, 0]}
              barSize={40}
              shape={RectangleShape}
            />
          </BarChart>
        )}
      </div>
    </div>
  );
}
