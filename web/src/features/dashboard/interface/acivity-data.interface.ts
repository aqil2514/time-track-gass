import { AIScreenReportDb } from "./ai-screen-db.interface";
import { SessionSummaryDb } from "./session-summary.interface";

export interface ActivityData extends Omit<SessionSummaryDb, 'raw_ids'> {
  items: AIScreenReportDb[];
}
