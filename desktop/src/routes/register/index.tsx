import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Check, X } from "lucide-react";
import { AuthBackground } from "@/features/auth/auth-background";
import { TimerIcon } from "@/components/atoms/tmer-icon";
import { zodResolver } from "@hookform/resolvers/zod";
import { NavLink, useNavigate } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import {
  registerSchema,
  RegisterFormValues,
} from "@/features/auth/schema/register.schema";
import { FormFieldText } from "@/components/forms/form-field-text";
import { FormFieldPassword } from "@/components/forms/form-field-password";
import axios, { isAxiosError } from "axios";
import { buildUrl } from "@/utils/build-url";

// Struktur error response NestJS
interface NestErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}

function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <Check className="w-3.5 h-3.5 text-amber-400" />
      ) : (
        <X className="w-3.5 h-3.5 text-slate-600" />
      )}
      <span className={`text-xs ${met ? "text-amber-400" : "text-slate-500"}`}>
        {label}
      </span>
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const form = useForm<RegisterFormValues>({
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    form.clearErrors("root");

    try {
      const url = buildUrl("auth/register");
      await axios.post(url, values);
      navigate("/login", {
        state: { successMessage: "Account created! Please sign in." },
      });
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data as NestErrorResponse | undefined;

        // 409 — username atau email sudah dipakai
        if (status === 409) {
          const message =
            typeof data?.message === "string" ? data.message.toLowerCase() : "";

          if (message.includes("username")) {
            form.setError("username", { message: "Username already exists" });
          } else if (message.includes("email")) {
            form.setError("email", { message: "Email already exists" });
          } else {
            form.setError("username", { message: "Username already exists" });
            form.setError("email", { message: "Email already exists" });
          }
          return;
        }

        // 400 — validasi dari backend
        if (status === 400) {
          const messages = Array.isArray(data?.message)
            ? data.message
            : [data?.message ?? "Invalid request"];

          const fieldMap: Record<string, keyof RegisterFormValues> = {
            fullname: "fullName",
            username: "username",
            email: "email",
            password: "password",
            confirmpassword: "confirmPassword",
          };

          let hasFieldError = false;
          for (const msg of messages) {
            for (const [key, field] of Object.entries(fieldMap)) {
              if (msg.toLowerCase().includes(key)) {
                form.setError(field, { message: msg });
                hasFieldError = true;
                break;
              }
            }
          }

          if (!hasFieldError) {
            form.setError("root", { message: messages.join(", ") });
          }
          return;
        }

        // 500 — server error
        if (status !== undefined && status >= 500) {
          form.setError("root", {
            message: "Server error. Please try again later.",
          });
          return;
        }

        // Network error
        if (!error.response) {
          form.setError("root", {
            message: "Network error. Check your internet connection.",
          });
          return;
        }
      }

      // Unknown error
      form.setError("root", {
        message: "Something went wrong. Please try again.",
      });
    }
  };

  const password = useWatch({ control: form.control, name: "password" });
  const confirmPassword = useWatch({
    control: form.control,
    name: "confirmPassword",
  });

  const isLoading = form.formState.isSubmitting;

  const rules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    match: password === confirmPassword && confirmPassword !== "",
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <AuthBackground />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <TimerIcon />
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Time Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Create your account to get started
          </p>
        </div>

        {/* Card */}
        <Card className="bg-slate-900/80 border-slate-800 shadow-2xl backdrop-blur-sm">
          <CardHeader className="pb-4 pt-6 px-6">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-xs text-slate-500 uppercase tracking-widest font-medium">
                New Account
              </span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-6 space-y-4">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormFieldText
                form={form}
                textVariant="slate"
                label="Full Name"
                name="fullName"
                placeholder="John Doe"
              />

              <FormFieldText
                form={form}
                textVariant="slate"
                label="Username"
                name="username"
                placeholder="johndoe"
              />

              <FormFieldText
                form={form}
                textVariant="slate"
                label="Email"
                name="email"
                placeholder="john@example.com"
              />

              <FormFieldPassword
                form={form}
                showForgotPassword={false}
                label="Password"
                name="password"
                textVariant="slate"
                placeholder="Create a strong password"
              />
              {password.length > 0 && (
                <div className="grid grid-cols-2 gap-1 pt-1 pb-2">
                  <PasswordRule met={rules.length} label="Min. 8 characters" />
                  <PasswordRule met={rules.uppercase} label="Uppercase letter" />
                  <PasswordRule met={rules.number} label="Contains number" />
                </div>
              )}

              <FormFieldPassword
                form={form}
                showForgotPassword={false}
                label="Confirm Password"
                name="confirmPassword"
                textVariant="slate"
                placeholder="Repeat your password"
              />

              {/* Root error — 500 & network */}
              {form.formState.errors.root && (
                <p className="text-xs text-red-400 text-center">
                  {form.formState.errors.root.message}
                </p>
              )}

              <Button
                disabled={isLoading}
                type="submit"
                className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            {/* Login link */}
            <div className="pt-1 text-center">
              <p className="text-slate-500 text-sm">
                Already have an account?{" "}
                <NavLink to={"/login"}>
                  <Button className="text-amber-400 hover:text-amber-300 transition-colors font-medium">
                    Sign in
                  </Button>
                </NavLink>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-6">
          © 2026 Time Tracker. All rights reserved.
        </p>
      </div>
    </div>
  );
}