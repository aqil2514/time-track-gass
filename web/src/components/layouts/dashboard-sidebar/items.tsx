import { LayoutDashboard, Users } from "lucide-react";

export const navItems = [
  {
    label: "Main Menu",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Organization",
    items: [
      { title: "Team", url: "/teams", icon: Users },
    ],
  },
];
