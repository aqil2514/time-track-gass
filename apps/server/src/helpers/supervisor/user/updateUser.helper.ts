import { ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { ProfilesWithNoPassword } from 'src/app/auth/interfaces/profiles.interface';
import { UpdateUserDto } from 'src/app/supervisor/dto/update-user.dto';

export async function updateUser(
  prisma: PrismaService,
  id: string,
  dto: UpdateUserDto,
  divisionName: string,
): Promise<ProfilesWithNoPassword> {
  try {
    const data = await prisma.profiles.update({
      where: { id },
      data: {
        full_name: dto.fullName,
        email: dto.email,
        role: dto.role,
        division: divisionName,
        division_id: dto.division ? BigInt(dto.division) : undefined,
      },
      select: {
        id: true,
        email: true,
        username: true,
        full_name: true,
        role: true,
        division: true,
      },
    });

    return data as unknown as ProfilesWithNoPassword;
  } catch (e: any) {
    if (e?.code === 'P2002') throw new ConflictException('Email already used by another user');
    throw e;
  }
}
