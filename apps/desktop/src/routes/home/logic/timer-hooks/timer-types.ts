export type TimerStatus =
  | "idle"
  | "countdown"
  | "capturing"
  | "uploading"
  | "error";

export type CaptureResult = "success" | "cooldown" | "error";
