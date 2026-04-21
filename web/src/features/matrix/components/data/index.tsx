import { Card, CardContent } from "@/components/ui/card";
import { useMatrixContext } from "../../provider/matrix.provider";
import { MatrixLegend } from "./legend";
import { MatrixHeader } from "./header";
import { MatrixUserData } from "./user-data";

const hours = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, "0"),
);

const calculateTotalHours = (activity: number[], intensity: number = 5) => {
  const totalMinutes = activity.reduce(
    (acc, curr) => acc + curr * intensity,
    0,
  );

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} menit`;

  if (minutes === 0) return `${hours} jam`;

  return `${hours} jam ${minutes} menit`;
};

export function MatrixData() {
  const { data, isLoading } = useMatrixContext();

  if (isLoading) {
    return (
      <div className="p-6 text-slate-500 animate-pulse">
        Memuat data matriks...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-6 text-slate-500">
        Tidak ada data aktivitas untuk tanggal ini.
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#020817] text-slate-400 text-[11px] font-sans">
      <Card className="bg-[#020817]/50 border-slate-800/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <MatrixHeader hours={hours} />

          <MatrixUserData
            calculateTotalHours={calculateTotalHours}
            data={data}
          />
        </CardContent>
      </Card>

      <MatrixLegend />
    </div>
  );
}
