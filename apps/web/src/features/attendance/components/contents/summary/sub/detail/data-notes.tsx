import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAttendanceDetail } from "@/features/attendance/interfaces/attendace-logs.interface";
import { format } from "date-fns";

interface Props {
  data: UserAttendanceDetail;
}

export function DetailDialogNotes({ data }: Props) {
  return (
    <div className="lg:col-span-5 p-5 rounded-xl bg-slate-800/20 border border-slate-800/60 flex flex-col">
      <h4 className="text-sm font-semibold mb-4 text-slate-300">
        Catatan Penambahan
      </h4>
      <div className="overflow-hidden rounded-lg border border-slate-800">
        <Table>
          <TableHeader className="bg-slate-800/50">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-[11px] uppercase tracking-wider text-slate-500">
                Tanggal
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-slate-500">
                Keterangan
              </TableHead>
              <TableHead className="text-right text-[11px] uppercase tracking-wider text-slate-500">
                Min
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.listNotes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-10 text-slate-500 text-xs"
                >
                  Tidak ada penambahan
                </TableCell>
              </TableRow>
            ) : (
              data.listNotes.map((note) => (
                <TableRow
                  key={note.id}
                  className="border-slate-800 hover:bg-slate-800/30"
                >
                  <TableCell className="text-[11px] text-slate-400 font-medium">
                    {format(new Date(note.date), "dd/MM/yy")}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="text-[13px] font-medium text-slate-200">
                      {note.adjustment.name}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">
                      {note.adjustment.notes}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-xs font-bold text-emerald-400">
                    +{note.affected_minutes}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
