import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useUserSetting } from "@/hooks/use-user-settings";
import api from "@/lib/api";
import { buildUrl } from "@/utils/build-url";
import { writeLogToDb } from "@/utils/write-log-to-db";
import { load } from "@tauri-apps/plugin-store";
import { isAxiosError } from "axios";
import { Settings2, Loader2, AlertCircle } from "lucide-react";
import { useMemo, useState } from "react";

export function ToggleMode() {
  const { data, mutate } = useUserSetting();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const isAuto = useMemo(() => {
    if (!data) return false;
    return data?.tracker.mode === "auto";
  }, [data]);

  const handleToggleMode = async () => {
    if (isLoading) return;

    const nextMode = isAuto ? "manual" : "auto";

    try {
      setIsLoading(true);
      setIsError(false);

      const store = await load("auth.json");
      const token = await store.get<string>("accessToken");

      if (!token) throw new Error("AccessToken missing");

      const url = buildUrl("auth/setting/tracker");
      await api.patch(
        url,
        { newValue: nextMode },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (mutate) await mutate();
    } catch (error) {
      console.error(error);
      setIsError(true);

      if (isAxiosError(error)) {
        await writeLogToDb({
          context: "handleToggleMode",
          level: "ERROR",
          message: error.message,
          metadata: error.response?.data || error,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenuItem
      disabled={isLoading}
      className={`flex items-center px-3 py-2.5 rounded-lg transition-all group cursor-pointer hover:bg-slate-800/50
      }`}
      onSelect={(e) => {
        e.preventDefault(); // Tetap terbuka agar user lihat feedback-nya
        handleToggleMode();
      }}
    >
      {/* Icon dengan State Loading/Error */}
      <div className="relative mr-3">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
        ) : isError ? (
          <AlertCircle className="h-4 w-4 text-red-500" />
        ) : (
          <Settings2
            className={`h-4 w-4 transition-colors ${
              isAuto ? "text-purple-400" : "text-slate-400"
            } group-hover:text-purple-400`}
          />
        )}
      </div>

      <div className="flex flex-col flex-1">
        <span className="text-[11px] font-bold text-white">
          Tracker:{" "}
          <span
            className={isAuto ? "text-purple-400" : "text-blue-400 uppercase"}
          >
            {isLoading ? "Updating..." : isAuto ? "Otomatis" : "Manual"}
          </span>
        </span>
        <span
          className={`text-[10px] ${isError ? "text-red-400" : "text-slate-500"}`}
        >
          {isError
            ? "Gagal update, coba lagi"
            : isAuto
              ? "Klik untuk mode manual"
              : "Klik untuk mode otomatis"}
        </span>
      </div>

      {/* Indikator Visual */}
      <div className="ml-auto flex items-center">
        {!isLoading &&
          !isError &&
          (isAuto ? (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
            </div>
          ) : (
            <div className="h-2 w-2 rounded-full bg-slate-600" />
          ))}
      </div>
    </DropdownMenuItem>
  );
}
