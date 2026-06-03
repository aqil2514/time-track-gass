import { NotFoundException } from '@nestjs/common';
import { SupabaseService } from 'src/services/supabase/supabase.service';
import { TableName } from 'src/services/supabase/supabase.interface';
import { ProfilesDb } from 'src/app/auth/interfaces/profiles.interface';
import {
  getIdentifierColumn,
  ensureUserCanResetPassword,
  buildCheckResetPasswordResponse,
} from 'src/helpers/auth/checkResetPassword.helper';

export { getIdentifierColumn, ensureUserCanResetPassword, buildCheckResetPasswordResponse };

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
