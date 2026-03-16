"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Clock, LayoutDashboard, Users } from "lucide-react";
import { useRouter } from "next/navigation";

export function DashboardSidebar() {
  const router = useRouter();
  return (
    <Sidebar className="border-r border-slate-800 bg-slate-900">
      {/* Header: Logo atau Nama Aplikasi */}
      <SidebarHeader className="p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {/* Logo Container */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-900/20">
            <Clock className="h-4 w-4 text-white rounded-sm" />
          </div>

          {/* Text Logo */}
          <div className="flex flex-col">
            <span className="font-bold text-slate-100 leading-none">
              Time Tracker
            </span>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">
              Dashboard
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-slate-900">
        {/* Grup 1: Navigasi Utama */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="cursor-pointer text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  onClick={() => router.push("/dashboard")}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Grup 2: Pengaturan & Tim */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500">
            Organization
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="cursor-pointer text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  onClick={() => router.push("/teams")}
                >
                  <Users className="w-4 h-4" />
                  <span>Team</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer: Profil Pengguna */}
      <SidebarFooter className="p-4 border-t border-slate-800 bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600" />
          <div className="flex flex-col overflow-hidden text-sm">
            <span className="font-medium text-slate-200 truncate">
              User Name
            </span>
            <span className="text-xs text-slate-500 truncate">
              user@email.com
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
