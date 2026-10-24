import sharp from 'sharp';
import { NineRouterService } from 'src/services/nine-router/nine-router.service';

const NINE_ROUTER_MODEL = 'ag/gemini-3-flash';

const jsonSchema = {
  type: 'object',
  properties: {
    date: {
      type: 'string',
      description: 'date shown in the taskbar/screenshot image, format YYYY-MM-DD, empty string if not found',
    },
    time: {
      type: 'string',
      description: 'time shown in the taskbar/screenshot image, format HH:mm, empty string if not found',
    },
  },
  required: ['date', 'time'],
};

export interface AIResult {
  date: string | null;
  time: string | null;
}

export async function adjustImage(file: Express.Multer.File, os: string) {
  const image = sharp(file.buffer);
  const { width, height } = await image.metadata();

  if (!width || !height) throw new Error('Gagal membaca metadata gambar');

  const cropWidth = Math.max(Math.floor(width * 0.15), 200);
  const cropHeight = Math.max(Math.floor(height * 0.08), 80);

  let extractOptions: sharp.Region;

  if (os.toLowerCase() === 'macos') {
    extractOptions = {
      left: width - cropWidth,
      top: 0,
      width: cropWidth,
      height: cropHeight,
    };
  } else {
    extractOptions = {
      left: width - cropWidth,
      top: height - cropHeight,
      width: cropWidth,
      height: cropHeight,
    };
  }

  return await image
    .extract(extractOptions)
    .resize(1200)
    .greyscale()
    .normalize()
    .threshold(128)
    .toBuffer();
}

export async function extractDateTime(
  image: Buffer<ArrayBufferLike>,
  nineRouter: NineRouterService,
): Promise<AIResult> {
  try {
    const result = await nineRouter.analyzeImage({
      model: NINE_ROUTER_MODEL,
      prompt: 'Extract the date and time shown in this taskbar/screenshot image. If date or time not found, use an empty string for that field.',
      imageBase64: image.toString('base64'),
      mimeType: 'image/png',
      jsonSchema,
    });

    return JSON.parse(result.text);
  } catch {
    return { date: null, time: null };
  }
}
