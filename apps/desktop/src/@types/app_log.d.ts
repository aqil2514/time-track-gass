export interface AppLogInsert {
  level: string;
  os?: string;
  message: string;
  context: string; // nama fungsi
  metadata: unknown;
}
