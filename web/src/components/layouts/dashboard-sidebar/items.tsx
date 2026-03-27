import { Activity, LayoutDashboard, TableProperties, Users } from "lucide-react";

export const navItems = [
  {
    label: "Main Menu",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Matriks Aktivitas", url: "/matrix", icon: TableProperties },
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
