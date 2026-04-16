import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AttendanceLogsAdjustmentType } from "@/features/attendance/schema/attendance-logs-adjustment.schema";
import { CalendarDays } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

interface Props {
  form: UseFormReturn<AttendanceLogsAdjustmentType>;
}

export function AttendanceDateField({ form }: Props) {
  return (
    <div className="border border-slate-700 p-5 rounded-2xl bg-slate-900/40">
      <FieldGroup>
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <Field>
                <FieldLabel className="text-slate-300 mb-2 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-amber-500" />
                  Tanggal Penyesuaian
                </FieldLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    className="bg-slate-800/60 border-slate-700 text-white h-11 rounded-lg focus:border-amber-500 focus:ring-amber-500/20 transition-colors scheme-dark"
                  />
                </FormControl>
                <FormMessage className="text-xs text-red-400 mt-2" />
              </Field>
            </FormItem>
          )}
        />
      </FieldGroup>
      <p className="text-[10px] text-slate-500 mt-2 italic">
        * Penyesuaian akan diterapkan pada log kerja di tanggal yang dipilih.
      </p>
    </div>
  );
}