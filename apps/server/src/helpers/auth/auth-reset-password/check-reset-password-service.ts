import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from 'src/services/supabase/supabase.service';
import { TableName } from 'src/services/supabase/supabase.interface';
import { ProfilesDb } from 'src/app/auth/interfaces/profiles.interface';

export function isEmailIdentifier(identifier: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
}

export function getIdentifierColumn(identifier: string): 'email' | 'username' {
  return isEmailIdentifier(identifier) ? 'email' : 'username';
}

export async function getResetPasswordUser(
  supabaseService: SupabaseService,
  identifier: string,
): Promise<ProfilesDb> {
  const column = getIdentifierColumn(identifier);

  const isExistAccount = await supabaseService.isExistValue(
    TableName.Profiles,
    column,
    identifier,
  );

  if (!isExistAccount) {
    throw new NotFoundException('user not found');
  }

  const users = await supabaseService.getDataByColumn<ProfilesDb>(
    TableName.Profiles,
    column,
    identifier,
  );

  return users[0];
}

export function ensureUserCanResetPassword(user: ProfilesDb): void {
  if (!user.must_reset_password) {
    throw new UnauthorizedException('Password reset is not available');
  }
}

export function buildCheckResetPasswordResponse(user: ProfilesDb) {
  return {
    success: true,
    mustResetPassword: user.must_reset_password,
  };
}
