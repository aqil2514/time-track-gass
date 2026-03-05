import { DashboardHeader } from "@/components/layouts/header";
import { getMe } from "@/lib/auth";
import { AuthProvider } from "@/providers/auth-provider";
import { redirect } from "next/navigation";
import React from "react";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getMe();
  if (!user) redirect("/login");

  return (
    <AuthProvider user={user}>
      <DashboardHeader />
      {children}
    </AuthProvider>
  );
}
