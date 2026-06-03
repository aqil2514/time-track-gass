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
import { Clock } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { navItems } from "./items";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function DashboardSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();

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
        {navItems.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-slate-500">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = item.url === pathname;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        className={cn(
                          "cursor-pointer text-slate-300 transition-colors",
                          isActive && "bg-white text-slate-800",
                          !isActive && "hover:bg-slate-800 hover:text-white",
                        )}
                        onClick={() => router.push(item.url)}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer: Profil Pengguna */}
      <SidebarFooter className="p-4 border-t border-slate-800 bg-slate-900">
        <div className="flex items-center gap-3 px-1">
          <Avatar className="h-8 w-8 rounded-lg border border-slate-700">
            <AvatarFallback className="rounded-lg bg-slate-800 text-slate-200 text-xs font-bold uppercase">
              {auth.user?.username?.slice(0, 2).toUpperCase() || "??"}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col overflow-hidden text-sm">
            <span className="font-medium text-slate-200 truncate leading-tight">
              {auth.user?.username}
            </span>
            <span className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">
              {auth.user?.email}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
