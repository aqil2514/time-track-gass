import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { ProfilesWithNoPassword } from 'src/app/auth/interfaces/profiles.interface';

export async function getUserById(
  prisma: PrismaService,
  id: string,
): Promise<ProfilesWithNoPassword> {
  const data = await prisma.profiles.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      username: true,
      full_name: true,
      role: true,
      division: true,
      division_id: true,
    },
  });

  if (!data) throw new NotFoundException(`User with ID ${id} not found`);

  return data as unknown as ProfilesWithNoPassword;
}
