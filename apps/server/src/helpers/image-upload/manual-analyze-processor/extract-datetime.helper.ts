import { fromZonedTime } from 'date-fns-tz';
import { Logger } from '@nestjs/common';
import { TIMEZONE } from 'src/constants/timezone';
import { NineRouterService } from 'src/services/nine-router/nine-router.service';

const logger = new Logger('extractDateTimeFromImage');

const NINE_ROUTER_MODEL = 'ag/gemini-3-flash';

const jsonSchema = {
  type: 'object',
  properties: {
    date: {
      type: 'string',
      description: 'system clock date in the taskbar, format YYYY-MM-DD, empty string if not visible',
    },
    time: {
      type: 'string',
      description: 'system clock time in the taskbar, format HH:mm, empty string if not visible',
    },
  },
  required: ['date', 'time'],
};

export interface ExtractDateTimeResult {
  date: Date;
  source: '9router' | 'filename';
}

export async function extractDateTimeFromImage(
  nineRouter: NineRouterService,
  base64Data: string,
  mimeType: string,
  originalFilename?: string,
): Promise<ExtractDateTimeResult | null> {
  const fromNineRouter = await tryNineRouter(nineRouter, base64Data, mimeType);
  if (fromNineRouter) {
    logger.log(`[9router] datetime extracted: ${fromNineRouter.toISOString()}`);
    return { date: fromNineRouter, source: '9router' };
  }
  logger.warn(`[9router] gagal extract datetime, fallback ke filename: "${originalFilename}"`);

  if (originalFilename) {
    const fromFilename = tryParseFilename(originalFilename);
    if (fromFilename) {
      logger.log(`[filename] datetime extracted: ${fromFilename.toISOString()} dari "${originalFilename}"`);
      return { date: fromFilename, source: 'filename' };
    }
    logger.warn(`[filename] gagal parse datetime dari filename: "${originalFilename}"`);
  }

  return null;
}

async function tryNineRouter(
  nineRouter: NineRouterService,
  base64Data: string,
  mimeType: string,
): Promise<Date | null> {
  try {
    const res = await nineRouter.analyzeImage({
      model: NINE_ROUTER_MODEL,
      prompt: `Extract the current system date and time from the taskbar or system clock visible in this screenshot.
Do NOT use dates or times shown in the page content, data tables, or documents.
If the system clock is not visible, use an empty string for both fields.`,
      imageBase64: base64Data,
      mimeType,
      jsonSchema,
    });

    let parsed: any;
    try {
      parsed = JSON.parse(res.text);
    } catch (parseErr) {
      logger.warn(`[9router] gagal parse JSON: ${parseErr instanceof Error ? parseErr.message : parseErr} | raw="${res.text}"`);
      return null;
    }

    if (!parsed.date || !parsed.time) {
      logger.warn(`[9router] date/time null di response: date=${parsed.date} time=${parsed.time}`);
      return null;
    }

    const combined = fromZonedTime(`${parsed.date}T${parsed.time}:00`, TIMEZONE);
    if (isNaN(combined.getTime())) {
      logger.warn(`[9router] datetime tidak valid: "${parsed.date}T${parsed.time}:00"`);
      return null;
    }

    return combined;
  } catch (err) {
    logger.warn(`[9router] exception saat generate content: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

function tryParseFilename(filename: string): Date | null {
  const match = filename.match(/(\d{4}-\d{2}-\d{2})[_ ](\d{2}-\d{2}-\d{2})/);
  if (!match) return null;

  const [, datePart, timePart] = match;
  const timeFormatted = timePart.replace(/-/g, ':');

  // Treat datetime in filename as WIB (Asia/Jakarta), convert to UTC
  const utcDate = fromZonedTime(`${datePart}T${timeFormatted}`, TIMEZONE);
  logger.debug(`[filename] raw="${datePart}T${timeFormatted}" WIB -> UTC="${utcDate.toISOString()}"`);
  return isNaN(utcDate.getTime()) ? null : utcDate;
}
