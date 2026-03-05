import { LoginTemplate } from "@/features/login/login.template";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return <LoginTemplate />;
}
