export interface SessionActivityItemProps {
  id: string;
  created_at: string;
  app_name: string;
  window_title: string;
  summary: string;
  category: string;
}

import { format } from "date-fns";
import { Globe, MessageSquare, Briefcase, Settings, AppWindow } from "lucide-react";

const getAppIcon = (appName: string) => {
  const name = appName.toLowerCase();

  // 1. Web & Browsing
  if (name.includes("chrome") || name.includes("browser") || name.includes("edge") || name.includes("firefox")) {
    return <Globe className="size-3 text-blue-400" />;
  }

  // 2. Communication
  if (name.includes("slack") || name.includes("whatsapp") || name.includes("discord") || name.includes("messenger") || name.includes("mail")) {
    return <MessageSquare className="size-3 text-emerald-400" />;
  }

  // 3. Productivity & Office (Termasuk Coding, Design, Spreadsheet)
  if (name.includes("code") || name.includes("figma") || name.includes("excel") || name.includes("word") || name.includes("notion")) {
    return <Briefcase className="size-3 text-purple-400" />;
  }

  // 4. System & Tools
  if (name.includes("settings") || name.includes("terminal") || name.includes("tracker") || name.includes("system")) {
    return <Settings className="size-3 text-slate-400" />;
  }

  // 5. Default Icon jika tidak ada yang cocok
  return <AppWindow className="size-3 text-slate-500" />;
};

export function SessionActivityItem({ activity }: { activity: SessionActivityItemProps }) {
  return (
    <div className="group relative flex gap-4 pb-6 last:pb-0">
      {/* Garis penghubung kecil antar item */}
      <div className="absolute left-2.75 top-7 bottom-0 w-0.5 bg-slate-800 group-last:hidden" />

      {/* Dot Waktu */}
      <div className="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900 shadow-sm">
        <div className="size-1.5 rounded-full bg-purple-500" />
      </div>

      {/* Konten Aktivitas */}
      <div className="flex flex-col gap-1 pt-0.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 tabular-nums">
            {format(new Date(activity.created_at), "HH:mm:ss")}
          </span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/50 border border-slate-700/50">
            {getAppIcon(activity.app_name)}
            <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
              {activity.app_name}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-200 line-clamp-1 leading-relaxed">
            {activity.window_title}
          </p>
          <p className="text-[11px] text-slate-500 leading-normal line-clamp-2 italic">
            "{activity.summary}"
          </p>
        </div>
      </div>
    </div>
  );
}