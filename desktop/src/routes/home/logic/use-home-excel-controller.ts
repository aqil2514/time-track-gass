import { useCallback, useState } from "react";
import { AIScreenReportDb } from "../types/ai-record.type";
import { formatDate } from "../components/columnsDef";
import * as XLSX from "xlsx";
import { writeFile } from "@tauri-apps/plugin-fs";
import { save } from "@tauri-apps/plugin-dialog";
import { writeLogToDb } from "@/utils/write-log-to-db";

export function useHomeExcelController() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const exportToExcel = useCallback(async (data: AIScreenReportDb[]) => {
    try {
      setIsLoading(true);

      // Pastikan data ada
      if (!data || data.length === 0) {
        throw new Error("Tidak ada data untuk diekspor.");
      }

      const mappedData = data.map(({ id, created_at, ...rest }) => ({
        created_at: formatDate(created_at),
        ...rest,
      }));

      const worksheet = XLSX.utils.json_to_sheet(mappedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

      const buffer: Uint8Array = XLSX.write(workbook, {
        type: "array",
        bookType: "xlsx",
      });

      // 🔥 Open Save Dialog
      const filePath = await save({
        defaultPath: "ai-screen-report.xlsx",
        filters: [
          {
            name: "Excel File",
            extensions: ["xlsx"],
          },
        ],
      });

      if (!filePath) return; // user cancel

      await writeFile(filePath, buffer);
      
      // Optional: Log sukses jika ingin track seberapa sering user ekspor
      console.info("Excel exported to:", filePath);

    } catch (error) {
      console.error(error);
      
      // Kirim log ke DB
      await writeLogToDb({
        context: "exportToExcel",
        level: "ERROR",
        message: error instanceof Error ? error.message : "Gagal ekspor Excel",
        metadata: {
          error,
          stack: error instanceof Error ? error.stack : undefined,
          dataCount: data?.length // Track jumlah data yang bikin crash
        },
      });

      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, exportToExcel };
}