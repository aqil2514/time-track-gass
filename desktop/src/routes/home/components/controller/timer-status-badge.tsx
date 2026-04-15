import { Badge } from "@/components/ui/badge";
import { useHomeContext } from "../../store/home.provider";
import { Pause, Clock, Camera, Upload, AlertCircle } from "lucide-react";

export function TimerStatusBadge() {
  const { controllerTime } = useHomeContext();
  const { status, countdown } = controllerTime;

  const baseStyle =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium gap-1";

  const statusConfig = {
    idle: {
      label: "Standby",
      className: "bg-gray-100 text-gray-600",
      icon: <Pause className="h-3 w-3" />,
    },
    countdown: {
      label: `Next in ${countdown}s`,
      className: "bg-blue-100 text-blue-600",
      icon: <Clock className="h-3 w-3" />,
    },
    capturing: {
      label: "Capturing...",
      className: "bg-yellow-100 text-yellow-700 animate-pulse",
      icon: <Camera className="h-3 w-3" />,
    },
    uploading: {
      label: "Processing AI Analysis...",
      className: "bg-purple-100 text-purple-700 animate-pulse",
      icon: <Upload className="h-3 w-3" />,
    },
    error: {
      label: "Error",
      className: "bg-red-100 text-red-600",
      icon: <AlertCircle className="h-3 w-3" />,
    },
  };

  const current = statusConfig[status];

  return (
    <Badge className={`${baseStyle} ${current.className}`}>
      {current.icon}
      {current.label}
    </Badge>
  );
}
