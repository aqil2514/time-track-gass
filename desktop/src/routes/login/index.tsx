import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { AuthBackground } from "@/features/auth/auth-background";
import { TimerIcon } from "@/components/atoms/tmer-icon";
import { zodResolver } from "@hookform/resolvers/zod";

import { NavLink, useLocation } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import {
  loginSchema,
  LoginSchemaType,
} from "@/features/auth/schema/login.schema";
import { FormFieldText } from "@/components/forms/form-field-text";
import { FormFieldPassword } from "@/components/forms/form-field-password";

export default function LoginPage() {
  const form = useForm<LoginSchemaType>({
    defaultValues: {
      identifier: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (values: LoginSchemaType) => {
    console.log(values);
  };

  const username = useWatch({
    control: form.control,
    name: "identifier",
  });

  const password = useWatch({
    control: form.control,
    name: "password",
  });

  const isLoading = form.formState.isSubmitting;

  const location = useLocation();
  const successMessage = location.state?.successMessage;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <AuthBackground />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <TimerIcon />
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Time Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Track every second that matters
          </p>
        </div>

        {/* Card */}
        <Card className="bg-slate-900/80 border-slate-800 shadow-2xl backdrop-blur-sm">
          <CardHeader className="pb-4 pt-6 px-6">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-xs text-slate-500 uppercase tracking-widest font-medium">
                Sign in to continue
              </span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-6 space-y-5">
            {successMessage && (
              <p className="text-xs text-amber-400 text-center">
                {successMessage}
              </p>
            )}
            <form action="" onSubmit={form.handleSubmit(onSubmit)}>
              {/* Username */}
              <FormFieldText
                form={form}
                textVariant="slate"
                label="Username or Email"
                name="identifier"
                placeholder="Enter your username or email"
              />

              {/* Password */}
              <FormFieldPassword
                form={form}
                label="Password"
                name="password"
                textVariant="slate"
                placeholder="Enter your password"
              />

              {/* Login Button */}
              <Button
                disabled={isLoading || !username || !password}
                type="submit"
                className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Register */}
            <div className="pt-1 text-center">
              <p className="text-slate-500 text-sm">
                Don't have an account?{" "}
                <NavLink to={"/register"}>
                  <Button className="text-amber-400 hover:text-amber-300 transition-colors font-medium">
                    Create account
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
