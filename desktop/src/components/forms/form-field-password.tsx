import { useState } from "react";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Controller, FieldValues } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react"; // icon show/hide, bisa diganti sesuai library
import { cn } from "@/lib/utils";
import { BasicFormFieldProps } from "./form.interface";
import { labelTextMapper } from "./form-constants";
import { Button } from "../ui/button";
import { useNavigate } from "react-router";

interface FormFieldPasswordProps<
  T extends FieldValues,
> extends BasicFormFieldProps<T> {
  showForgotPassword?: boolean;
}

export function FormFieldPassword<T extends FieldValues>({
  form,
  name,
  label,
  placeholder = "Isi password",
  className,
  textVariant = "default",
  showForgotPassword = true,
}: FormFieldPasswordProps<T>) {
  const isSubmitting = form.formState.isSubmitting;
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  return (
    <FieldGroup>
      <Controller
        name={name}
        control={form.control}
        render={({ field, fieldState }) => {
          return (
            <Field data-invalid={fieldState.invalid} className="relative">
              <div className="flex justify-between">
                <FieldLabel
                  htmlFor={field.name}
                  className={labelTextMapper[textVariant]}
                >
                  {label}
                </FieldLabel>

                {showForgotPassword && <Button
                  variant={"link"}
                  tabIndex={-1}
                  className="text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium"
                  onClick={() => navigate("/register")}
                >
                  Forgot Password
                </Button>}
              </div>
              <div className="relative">
                <Input
                  {...field}
                  type={showPassword ? "text" : "password"}
                  disabled={isSubmitting}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder={placeholder}
                  className={cn(
                    "bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20 h-11 rounded-lg transition-colors pr-10",
                    className,
                  )}
                />
                {/* Tombol show/hide */}
                <Button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  size={"icon"}
                  variant={"ghost"}
                  className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1} // agar tidak ikut tab navigasi
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              </div>

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          );
        }}
      />
    </FieldGroup>
  );
}
