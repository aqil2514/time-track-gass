import { Injectable } from '@nestjs/common';
import { RegisterDto } from '../dto/register.dto';
import { ProfilesDbInsert } from '../interfaces/profiles.interface';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthMapperService {
  async mapRegisterFormToDb(raw: RegisterDto): Promise<ProfilesDbInsert> {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(raw.password, salt);

    return {
      email: raw.email,
      full_name: raw.fullName,
      password: hashedPassword,
      role: raw.role ?? 'worker',
      username: raw.username,
      updated_at: new Date().toISOString(),
    };
  }
}
