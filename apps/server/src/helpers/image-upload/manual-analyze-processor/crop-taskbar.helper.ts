import sharp from 'sharp';

const TASKBAR_HEIGHT_RATIO = 0.08;

export async function cropTaskbar(
  base64Data: string,
  mimeType: string,
): Promise<{ base64Data: string; mimeType: string }> {
  const buffer = Buffer.from(base64Data, 'base64');
  const image = sharp(buffer);
  const { width, height } = await image.metadata();

  const cropHeight = Math.max(30, Math.round(height * TASKBAR_HEIGHT_RATIO));
  const top = height - cropHeight;

  const cropped = await image
    .extract({ left: 0, top, width, height: cropHeight })
    .png()
    .toBuffer();

  return {
    base64Data: cropped.toString('base64'),
    mimeType: 'image/png',
  };
}
