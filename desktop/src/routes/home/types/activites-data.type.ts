import { AIScreenReportDb } from "./ai-record.type";
import { SessionSummaryDb } from "./session-summary.type";

export interface ActivityData extends Omit<SessionSummaryDb, 'raw_ids'> {
  items: AIScreenReportDb[];
}
