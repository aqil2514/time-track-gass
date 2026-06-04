import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { softDeleteActivities } from 'src/helpers/supervisor/activity/softDeleteActivities.helper';
import { bulkEditActivityCategory } from 'src/helpers/supervisor/activity/bulkEditActivityCategory.helper';

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async softDeleteActivity(activityIds: string[]) {
    // Step 1: Soft delete activities di DB
    return softDeleteActivities(this.prisma, activityIds);
  }

  async bulkEditCategory(activityIds: string[], newCategory: string) {
    // Step 1: Update kategori activities di DB
    return bulkEditActivityCategory(this.prisma, activityIds, newCategory);
  }
}
