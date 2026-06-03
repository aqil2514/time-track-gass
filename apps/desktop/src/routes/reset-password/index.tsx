import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Check, X } from "lucide-react";
import { AuthBackground } from "@/features/auth/auth-background";
import { TimerIcon } from "@/components/atoms/tmer-icon";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, NavLink, useNavigate } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import { FormFieldText } from "@/components/forms/form-field-text";
import { FormFieldPassword } from "@/components/forms/form-field-password";
import axios, { isAxiosError } from "axios";
import { buildUrl } from "@/utils/build-url";
import { useAuth } from "@/hooks/use-auth";
import { Loading } from "@/components/layout/loading";
import {
  checkResetPasswordSchema,
  CheckResetPasswordValues,
  setResetPasswordSchema,
  SetResetPasswordValues,
} from "@/features/auth/schema/reset-password.schema";
import { useState } from "react";

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

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { loading, user } = useAuth();
  const [verifiedIdentifier, setVerifiedIdentifier] = useState<string | null>(null);

  const identifierForm = useForm<CheckResetPasswordValues>({
    defaultValues: {
      identifier: "",
    },
    resolver: zodResolver(checkResetPasswordSchema),
  });

  const passwordForm = useForm<SetResetPasswordValues>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    resolver: zodResolver(setResetPasswordSchema),
  });

  const password = useWatch({
    control: passwordForm.control,
    name: "password",
  });

  const confirmPassword = useWatch({
    control: passwordForm.control,
    name: "confirmPassword",
  });

  const rules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    match: password === confirmPassword && confirmPassword !== "",
  };

  const handleCheckIdentifier = async (values: CheckResetPasswordValues) => {
    identifierForm.clearErrors("root");

    try {
      const url = buildUrl("auth/check-reset-password");
      await axios.post(url, values);
      setVerifiedIdentifier(values.identifier);
      passwordForm.clearErrors();
      passwordForm.reset();
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data as NestErrorResponse | undefined;
        const message = Array.isArray(data?.message)
          ? data.message.join(", ")
          : data?.message ?? "Something went wrong";

        if (status === 404) {
          identifierForm.setError("identifier", { message: "Account not found" });
          return;
        }

        if (status === 400) {
          if (message.toLowerCase().includes("identifier")) {
            identifierForm.setError("identifier", { message });
          } else {
            identifierForm.setError("root", { message });
          }
          return;
        }

        if (status !== undefined && status < 500) {
          identifierForm.setError("root", { message });
          return;
        }

        if (status !== undefined && status >= 500) {
          identifierForm.setError("root", {
            message: "Server error. Please try again later.",
          });
          return;
        }

        if (!error.response) {
          identifierForm.setError("root", {
            message: "Network error. Check your internet connection.",
          });
          return;
        }
      }

      identifierForm.setError("root", {
        message: "Something went wrong. Please try again.",
      });
    }
  };

  const handleResetPassword = async (values: SetResetPasswordValues) => {
    if (!verifiedIdentifier) {
      passwordForm.setError("root", {
        message: "Please verify your account first.",
      });
      return;
    }

    passwordForm.clearErrors("root");

    try {
      const url = buildUrl("auth/set-reset-password");
      await axios.post(url, {
        identifier: verifiedIdentifier,
        password: values.password,
      });

      navigate("/login", {
        state: {
          successMessage: "Password reset successful. Please sign in.",
        },
      });
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data as NestErrorResponse | undefined;
        const messages = Array.isArray(data?.message)
          ? data.message
          : [data?.message ?? "Something went wrong"];

        if (status === 400) {
          let hasFieldError = false;

          for (const message of messages) {
            const lower = message.toLowerCase();

            if (lower.includes("confirmpassword") || lower.includes("confirm password")) {
              passwordForm.setError("confirmPassword", { message });
              hasFieldError = true;
              continue;
            }

            if (lower.includes("password")) {
              passwordForm.setError("password", { message });
              hasFieldError = true;
              continue;
            }
          }

          if (!hasFieldError) {
            passwordForm.setError("root", { message: messages.join(", ") });
          }
          return;
        }

        if (status !== undefined && status < 500) {
          const message = messages.join(", ");
          passwordForm.setError("root", { message });
          if (message.toLowerCase().includes("reset") || message.toLowerCase().includes("must reset")) {
            setVerifiedIdentifier(null);
            identifierForm.setValue("identifier", verifiedIdentifier);
          }
          return;
        }

        if (status !== undefined && status >= 500) {
          passwordForm.setError("root", {
            message: "Server error. Please try again later.",
          });
          return;
        }

        if (!error.response) {
          passwordForm.setError("root", {
            message: "Network error. Check your internet connection.",
          });
          return;
        }
      }

      passwordForm.setError("root", {
        message: "Something went wrong. Please try again.",
      });
    }
  };

  const handleChangeIdentifier = () => {
    setVerifiedIdentifier(null);
    passwordForm.clearErrors();
    passwordForm.reset();
  };

  if (loading) return <Loading />;

  if (user) return <Navigate to="/" />;

  const isIdentifierStep = !verifiedIdentifier;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <AuthBackground />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <TimerIcon />
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Reset Password
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            {isIdentifierStep
              ? "Verify your account before setting a new password"
              : "Create a new password for your account"}
          </p>
        </div>

        <Card className="bg-slate-900/80 border-slate-800 shadow-2xl backdrop-blur-sm">
          <CardHeader className="pb-4 pt-6 px-6">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-xs text-slate-500 uppercase tracking-widest font-medium">
                {isIdentifierStep ? "Verify Account" : "Set New Password"}
              </span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-6 space-y-4">
            {isIdentifierStep ? (
              <form
                onSubmit={identifierForm.handleSubmit(handleCheckIdentifier)}
                className="space-y-4"
              >
                <FormFieldText
                  form={identifierForm}
                  textVariant="slate"
                  label="Username or Email"
                  name="identifier"
                  placeholder="Enter your username or email"
                />

                {identifierForm.formState.errors.root && (
                  <p className="text-xs text-red-400 text-center">
                    {identifierForm.formState.errors.root.message}
                  </p>
                )}

                <Button
                  disabled={identifierForm.formState.isSubmitting}
                  type="submit"
                  className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {identifierForm.formState.isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </form>
            ) : (
              <form
                onSubmit={passwordForm.handleSubmit(handleResetPassword)}
                className="space-y-4"
              >
                <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                  <p className="text-xs text-slate-500">Verified account</p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="text-sm text-white break-all">{verifiedIdentifier}</p>
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto px-0 text-xs text-amber-400 hover:text-amber-300"
                      onClick={handleChangeIdentifier}
                    >
                      Change
                    </Button>
                  </div>
                </div>

                <FormFieldPassword
                  form={passwordForm}
                  showForgotPassword={false}
                  label="New Password"
                  name="password"
                  textVariant="slate"
                  placeholder="Create a strong password"
                />

                {password.length > 0 && (
                  <div className="grid grid-cols-2 gap-1 pt-1 pb-2">
                    <PasswordRule met={rules.length} label="Min. 8 characters" />
                    <PasswordRule met={rules.uppercase} label="Uppercase letter" />
                    <PasswordRule met={rules.number} label="Contains number" />
                    <PasswordRule met={rules.match} label="Passwords match" />
                  </div>
                )}

                <FormFieldPassword
                  form={passwordForm}
                  showForgotPassword={false}
                  label="Confirm Password"
                  name="confirmPassword"
                  textVariant="slate"
                  placeholder="Repeat your password"
                />

                {passwordForm.formState.errors.root && (
                  <p className="text-xs text-red-400 text-center">
                    {passwordForm.formState.errors.root.message}
                  </p>
                )}

                <Button
                  disabled={passwordForm.formState.isSubmitting}
                  type="submit"
                  className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {passwordForm.formState.isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Resetting...</span>
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            )}

            <div className="pt-1 text-center">
              <p className="text-slate-500 text-sm">
                Remember your password?{" "}
                <NavLink to="/login">
                  <Button className="text-amber-400 hover:text-amber-300 transition-colors font-medium">
                    Back to sign in
                  </Button>
                </NavLink>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-slate-600 text-xs mt-6">
          © 2026 Time Tracker. All rights reserved.
        </p>
      </div>
    </div>
  );
}
