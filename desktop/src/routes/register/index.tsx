import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Clock, Eye, EyeOff, Timer, Check, X } from "lucide-react";
import { AuthBackground } from "@/features/auth/auth-background";
import { NavLink } from "react-router";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const rules = {
    length: form.password.length >= 8,
    uppercase: /[A-Z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    match:
      form.password === form.confirmPassword && form.confirmPassword !== "",
  };

  const isValid =
    form.fullName &&
    form.username &&
    form.email &&
    rules.length &&
    rules.uppercase &&
    rules.number &&
    rules.match;

  const handleRegister = () => {
    if (!isValid) return;
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <AuthBackground />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500 mb-4 shadow-lg shadow-amber-500/25">
            <Timer className="w-8 h-8 text-slate-950" strokeWidth={2.5} />
          </div>
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
            {/* Full Name */}
            <div className="space-y-2">
              <Label
                htmlFor="fullName"
                className="text-slate-300 text-sm font-medium"
              >
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20 h-11 rounded-lg transition-colors"
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-slate-300 text-sm font-medium"
              >
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20 h-11 rounded-lg transition-colors"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-slate-300 text-sm font-medium"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20 h-11 rounded-lg transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-slate-300 text-sm font-medium"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20 h-11 rounded-lg pr-11 transition-colors"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Password rules */}
              {form.password.length > 0 && (
                <div className="grid grid-cols-2 gap-1 pt-1">
                  <PasswordRule met={rules.length} label="Min. 8 characters" />
                  <PasswordRule
                    met={rules.uppercase}
                    label="Uppercase letter"
                  />
                  <PasswordRule met={rules.number} label="Contains number" />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-slate-300 text-sm font-medium"
              >
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  className={`bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 h-11 rounded-lg pr-11 transition-colors focus:ring-amber-500/20 ${
                    form.confirmPassword.length > 0
                      ? rules.match
                        ? "border-amber-500/50 focus:border-amber-500"
                        : "border-red-500/50 focus:border-red-500"
                      : "focus:border-amber-500"
                  }`}
                />
                <button
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {form.confirmPassword.length > 0 && !rules.match && (
                <p className="text-xs text-red-400">Passwords do not match</p>
              )}
            </div>

            {/* Register Button */}
            <Button
              onClick={handleRegister}
              disabled={isLoading || !isValid}
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
