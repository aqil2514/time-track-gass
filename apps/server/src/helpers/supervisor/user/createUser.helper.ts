import { ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { ProfilesWithNoPassword } from 'src/app/auth/interfaces/profiles.interface';
import { CreateUserDto } from 'src/app/supervisor/_dto/create-user.dto';

export async function createUser(
  prisma: PrismaService,
  eventEmitter: EventEmitter2,
  dto: CreateUserDto,
  divisionName: string,
): Promise<ProfilesWithNoPassword> {
  const payload = {
    full_name: dto.fullName,
    username: dto.username,
    email: dto.email,
    password: dto.password,
    role: dto.role,
    division: divisionName,
    must_reset_password: false,
    division_id: BigInt(dto.division),
  };

  try {
    const data = await prisma.profiles.create({
      data: payload as any,
      select: {
        id: true,
        email: true,
        username: true,
        full_name: true,
        role: true,
        division: true,
      },
    });

    eventEmitter.emit('profile.created', payload);

    return data as unknown as ProfilesWithNoPassword;
  } catch (e: any) {
    if (e?.code === 'P2002') throw new ConflictException('User already exists');
    throw e;
  }
}
