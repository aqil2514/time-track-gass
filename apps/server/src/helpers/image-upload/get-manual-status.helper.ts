import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { FlowProducer } from 'bullmq';
import { QUERY_NAME } from 'src/constants/queue.constant';
import { TIMEZONE } from 'src/constants/timezone';
import { PrismaService } from 'src/services/prisma/prisma.service';

export async function checkIsHaveInDb(
  prisma: PrismaService,
  slotId: number,
  userId: string,
  date: string,
): Promise<boolean> {
  const localDate = toZonedTime(new Date(date), TIMEZONE);
  const dateString = format(localDate, 'yyyy-MM-dd');

  // Konversi slotId (jam WIB) ke UTC
  const utcHour = slotId - 7;

  const startOfHour = new Date(`${dateString}T00:00:00.000Z`);
  startOfHour.setUTCHours(utcHour, 0, 0, 0);

  const endOfHour = new Date(`${dateString}T00:00:00.000Z`);
  endOfHour.setUTCHours(utcHour, 59, 59, 999);

  const data = await prisma.ai_screen_report.findFirst({
    where: {
      user_id: userId,
      deleted_at: null,
      created_at: {
        gte: startOfHour,
        lte: endOfHour,
      },
    },
    select: { id: true },
  });

  return !!data;
}

export async function checkIsHaveInBullMq(
  manualAnalyzeFlow: FlowProducer,
  slotId: number,
  userId: string,
  date: string,
): Promise<boolean> {
  const localDate = toZonedTime(new Date(date), TIMEZONE);
  const formattedDate = format(localDate, 'dd-MM-yyyy');

  const flows = await manualAnalyzeFlow.getFlow({
    id: `manual-analyze-${userId}-${slotId}-${formattedDate}`,
    queueName: QUERY_NAME.MANUAL_SLOT_STATUS,
  });

  return !!flows;
}
