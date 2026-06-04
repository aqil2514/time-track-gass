import { PrismaService } from 'src/services/prisma/prisma.service';

export async function markMustResetPassword(
  prisma: PrismaService,
  id: string,
): Promise<void> {
  await prisma.profiles.update({
    where: { id },
    data: { must_reset_password: true },
  });
}
