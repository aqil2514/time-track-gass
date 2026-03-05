"use client";
import { useForm, useWatch } from "react-hook-form";
import { loginSchema, LoginSchemaType } from "../schema/login-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormFieldPassword } from "@/components/forms/form-field-password";
import { FormFieldText } from "@/components/forms/form-field-text";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { buildUrl } from "@/utils/build-url";
import { isAxiosError } from "axios";
import { api } from "@/lib/api";
import { loginServerErrorMapper } from "../helpers/server-error-mapper";
import { serverErrorMapper } from "@/utils/server-error-mapper";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const form = useForm<LoginSchemaType>({
    defaultValues: {
      identifier: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
  });

  const username = useWatch({
    control: form.control,
    name: "identifier",
  });

  const password = useWatch({
    control: form.control,
    name: "password",
  });

  const isLoading = form.formState.isSubmitting;

  const rootError = form.formState.errors.root?.message;

  const onSubmit = async (values: LoginSchemaType) => {
    const url = buildUrl("auth/login/supervisor");
    try {
      await api.post(url, values);
      router.push("/dashboard");
    } catch (error) {
      if (isAxiosError(error)) {
        serverErrorMapper(form, loginServerErrorMapper, error.status);

        throw error;
      }
    }
  };

  return (
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

      {rootError && <p className="text-red-500 text-sm">{rootError}</p>}

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
  );
}
