type TimeUnit = "seconds" | "minutes" | "hours";

export function formatToTime(value: number, unit: TimeUnit = "seconds"): string {
  const totalSeconds =
    unit === "hours" ? value * 3600
    : unit === "minutes" ? value * 60
    : value;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} jam`);
  if (minutes > 0) parts.push(`${minutes} menit`);
  if (seconds > 0) parts.push(`${seconds} detik`);

  return parts.length > 0 ? parts.join(" ") : "0 detik";
}