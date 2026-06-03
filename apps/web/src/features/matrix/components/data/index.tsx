import { Card, CardContent } from "@/components/ui/card";
import { useUsername } from "@/hooks/resources/use-username";
import { useQueryParams } from "@/hooks/use-query-params";
import { useMatrixContext } from "../../provider/matrix.provider";
import { MatrixLegend } from "./legend";
import { MatrixHeader } from "./header";
import { MatrixUserData } from "./user-data";

const hours = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, "0"),
);

export function MatrixData() {
  const { data, isLoading } = useMatrixContext();
  const { data: users } = useUsername();
  const { get } = useQueryParams();
  const selectedDivision = get("division");
  const filteredData = selectedDivision
    ? data?.filter((user) => {
        const profile = users.find((profile) => profile.id === user.userId);
        return profile?.division === selectedDivision;
      })
    : data;

  if (isLoading) {
    return (
      <div className="p-6 text-slate-500 animate-pulse">
        Memuat data matriks...
      </div>
    );
  }

  if (!filteredData || filteredData.length === 0) {
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

          <MatrixUserData data={filteredData} />
        </CardContent>
      </Card>

      <MatrixLegend />
    </div>
  );
}
