import { LabelValue } from "@/@types/general";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AttendanceLogsAdjustmentType } from "@/features/attendance/schema/attendance-logs-adjustment.schema";
import { useUserData } from "@/features/teams/hooks/use-user-data";
import { Trash2, Users, RefreshCw, Loader2, AlertCircle } from "lucide-react"; // Tambahan icon
import { useMemo } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";

interface Props {
  form: UseFormReturn<AttendanceLogsAdjustmentType>;
}

export function ProfileImpactField({ form }: Props) {
  // Mengambil state dari hook
  const { data = [], error, isLoading, mutate } = useUserData();

  const userOptions = useMemo<LabelValue[]>(
    () => data.map((d) => ({ label: d.full_name, value: d.id })),
    [data],
  );

  const selectedIds =
    useWatch({
      control: form.control,
      name: "profile_id",
    }) || [];

  const handleAdd = (val: string) => {
    if (!selectedIds.includes(val)) {
      form.setValue("profile_id", [...selectedIds, val]);
    }
  };

  const handleRemove = (val: string) => {
    form.setValue(
      "profile_id",
      selectedIds.filter((id) => id !== val),
    );
  };

  return (
    <div className="space-y-4 border border-slate-700 p-5 rounded-2xl bg-slate-900/40">
      <FieldGroup>
        <Field>
          <div className="flex items-center justify-between mb-2">
            <FieldLabel className="text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              Pilih Karyawan yang Berdampak
            </FieldLabel>
            
            {/* Menggunakan mutate untuk fitur refresh data */}
            <button
              type="button"
              onClick={() => mutate()}
              disabled={isLoading}
              className="text-slate-500 hover:text-amber-500 disabled:opacity-50 transition-colors"
              title="Refresh daftar karyawan"
            >
              <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
            </button>
          </div>

          <Select onValueChange={handleAdd} value="" disabled={isLoading || !!error}>
            <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white h-11 rounded-lg focus:ring-amber-500/20 transition-colors">
              <SelectValue 
                placeholder={
                  isLoading 
                    ? "Sedang memuat data..." 
                    : error 
                      ? "Gagal memuat data karyawan" 
                      : "Klik untuk mencari/memilih karyawan..."
                } 
              />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-white">
              {userOptions.length > 0 ? (
                userOptions.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    disabled={selectedIds.includes(opt.value)}
                    className="focus:bg-amber-500 focus:text-white"
                  >
                    {opt.label}
                  </SelectItem>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  Tidak ada data karyawan
                </div>
              )}
            </SelectContent>
          </Select>

          {/* Alert jika Error terjadi */}
          {error && (
            <div className="mt-2 flex items-center gap-2 text-[11px] text-red-400 bg-red-400/10 p-2 rounded-lg border border-red-400/20">
              <AlertCircle className="w-3 h-3" />
              <span>Gagal sinkronisasi data tim. Silakan coba lagi.</span>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {isLoading ? (
               <div className="flex items-center gap-2 text-[10px] text-slate-500 italic uppercase tracking-wider">
                 <Loader2 className="w-3 h-3 animate-spin" />
                 Sinkronisasi data...
               </div>
            ) : selectedIds.length > 0 ? (
              selectedIds.map((id) => {
                const user = userOptions.find((u) => u.value === id);
                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 pl-3 pr-1 py-1.5 bg-slate-800 border border-slate-600 rounded-full group hover:border-amber-500/50 transition-all"
                  >
                    <span className="text-xs text-slate-200">
                      {user?.label || "User tidak ditemukan"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemove(id)}
                      className="p-1 rounded-full text-slate-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="text-[10px] text-slate-500 italic uppercase tracking-wider">
                Belum ada karyawan terpilih
              </p>
            )}
          </div>

          {form.formState.errors.profile_id && (
            <p className="text-xs text-red-400 mt-2">
              {form.formState.errors.profile_id.message}
            </p>
          )}
        </Field>
      </FieldGroup>

      <div className="flex justify-between items-center px-1">
        <Button
          type="button"
          variant="link"
          disabled={isLoading || userOptions.length === 0}
          className="text-[11px] text-amber-500/80 hover:text-amber-500 p-0 h-auto disabled:text-slate-600"
          onClick={() =>
            form.setValue(
              "profile_id",
              userOptions.map((u) => u.value),
            )
          }
        >
          Pilih Semua Karyawan
        </Button>
        {selectedIds.length > 0 && (
          <Button
            type="button"
            variant="link"
            className="text-[11px] text-slate-500 hover:text-slate-300 p-0 h-auto"
            onClick={() => form.setValue("profile_id", [])}
          >
            Bersihkan
          </Button>
        )}
      </div>
    </div>
  );
}