import { AIScreenReportDb } from 'src/app/image-upload/interfaces/ai-screen-report.interface';
import { SessionSummaryDb } from './session_summary.interface';

export interface ActivityData extends Omit<SessionSummaryDb, 'raw_ids'> {
  items: AIScreenReportDb[];
}
