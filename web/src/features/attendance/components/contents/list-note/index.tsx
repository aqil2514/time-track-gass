import { ContentContainer } from "@/components/containers/content-container";
import { Button } from "@/components/ui/button";
import { useQueryParams } from "@/hooks/use-query-params";
import { Plus } from "lucide-react";
import { ListNoteAddDialog } from "./dialogs/add";

export function AttendanceListNote() {
  const { set } = useQueryParams();
  return (
    <>
      <ContentContainer
        title="Master Kategori Penyesuaian"
        description="Atur template kategori absensi (Cuti, Sakit, dll) dan otomatisasi penambahan menit kerja."
        rightElement={
          <Button
            size="sm"
            className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
            onClick={() => set("action", "add")}
          >
            <Plus className="w-4 h-4" />
            Tambah Kategori
          </Button>
        }
      >
        List Note
      </ContentContainer>

      <ListNoteAddDialog />
    </>
  );
}
