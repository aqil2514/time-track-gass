import { useCallback, useState } from "react";
import { AIScreenReportDb } from "../types/ai-record.type";
import { formatDate } from "../components/columnsDef";
import * as XLSX from "xlsx";
import { writeFile } from "@tauri-apps/plugin-fs";
import { save } from "@tauri-apps/plugin-dialog";

export function useHomeExcelController() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const exportToExcel = useCallback(async (data: AIScreenReportDb[]) => {
    try {
      setIsLoading(true);

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
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, exportToExcel };
}