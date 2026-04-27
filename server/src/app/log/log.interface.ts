export interface AppLogInsertClient {
  level: string;
  os?: string;
  message: string;
  context: string; // nama fungsi
  metadata: unknown;
}

export interface AppLogInsertDb extends AppLogInsertClient {
  user_id: string;
}
