import { DashboardHeader } from "@/components/layouts/header";
import { getMe } from "@/lib/auth";
import { AuthProvider } from "@/providers/auth-provider";
import { redirect } from "next/navigation";
import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import { DashboardSidebar } from "@/components/layouts/dashboard-sidebar";

export const dynamic = 'force-dynamic'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getMe();
  const cookieStorage = await cookies();

  const isOpenSidebar = cookieStorage.get("sidebar_state")?.value === "true";
  if (!user) redirect("/login");

  return (
    <SidebarProvider defaultOpen={isOpenSidebar}>
      <AuthProvider user={user}>
        <DashboardSidebar />
        <div className="w-full">
          <DashboardHeader />
          {children}
        </div>
      </AuthProvider>
    </SidebarProvider>
  );
}
