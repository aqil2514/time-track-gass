import { Activity, LayoutDashboard, Users } from "lucide-react";

export const navItems = [
  {
    label: "Main Menu",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Organisasi",
    items: [
      { title: "Tim", url: "/teams", icon: Users },
      { title: "Aktivitas", url: "/activity", icon: Activity },
    ],
  },
];
