import { CallToolResult } from '@modelcontextprotocol/sdk/types';
import { Resolver, Tool, UseGuards } from '@nestjs-mcp/server';
import { z } from 'zod';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { McpGuard } from './mcp.guard';
import { getAllUserProfiles } from 'src/helpers/supervisor/user-activity/getAllUserProfiles.helper';
import { getActiveSessions } from 'src/helpers/work-session/cron/autoEndSessions.helper';
import {
  getDailySummaryTime,
  getWeeklySummaryTime,
  getActivityAdjustment,
} from 'src/helpers/activities/getTotalWork.helper';
import { getSummaryByDateRange } from 'src/helpers/supervisor/attendance/summary/getSummaryByDateRange.helper';

const READ_ONLY = {
  annotations: { readOnlyHint: true, destructiveHint: false },
};

function toJSON(data: unknown): string {
  return JSON.stringify(data, (_: string, v: unknown) => (typeof v === 'bigint' ? Number(v) : v), 2);
}

@UseGuards(McpGuard)
@Resolver()
export class TimetrackMCPResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Tool({
    name: 'server_health_check',
    description: 'Check if the server is operational',
    ...READ_ONLY,
  })
  healthCheck(): CallToolResult {
    return {
      content: [
        {
          type: 'text',
          text: 'Server is operational. All systems running normally.',
        },
      ],
    };
  }

  @Tool({
    name: 'get_all_users',
    description: 'Get list of all active user profiles',
    ...READ_ONLY,
  })
  async getAllUsers(): Promise<CallToolResult> {
    const users = await getAllUserProfiles(this.prisma);
    return {
      content: [{ type: 'text', text: toJSON(users) }],
    };
  }

  @Tool({
    name: 'get_active_sessions',
    description:
      'Get all currently active work sessions (users who are currently working)',
    ...READ_ONLY,
  })
  async getActiveSessions(): Promise<CallToolResult> {
    const sessions = await getActiveSessions(this.prisma);
    return {
      content: [{ type: 'text', text: toJSON(sessions) }],
    };
  }

  @Tool({
    name: 'get_daily_summary',
    description:
      'Get total work time summary for a specific user on a specific date',
    paramsSchema: {
      userId: z.string().describe('User UUID'),
      date: z.string().describe('Date in yyyy-MM-dd format'),
    },
    ...READ_ONLY,
  })
  async getDailySummary({
    userId,
    date,
  }: {
    userId: string;
    date: string;
  }): Promise<CallToolResult> {
    const summary = await getDailySummaryTime(this.prisma, userId, date);
    return {
      content: [{ type: 'text', text: toJSON(summary) }],
    };
  }

  @Tool({
    name: 'get_weekly_summary',
    description:
      'Get total work time summary for a specific user for the week containing the given date',
    paramsSchema: {
      userId: z.string().describe('User UUID'),
      date: z
        .string()
        .describe('Any date within the target week, in yyyy-MM-dd format'),
    },
    ...READ_ONLY,
  })
  async getWeeklySummary({
    userId,
    date,
  }: {
    userId: string;
    date: string;
  }): Promise<CallToolResult> {
    const summary = await getWeeklySummaryTime(this.prisma, userId, date);
    return {
      content: [{ type: 'text', text: toJSON(summary) }],
    };
  }

  @Tool({
    name: 'get_attendance_summary',
    description: 'Get attendance logs for all users within a date range',
    paramsSchema: {
      startDate: z.string().describe('Start date in yyyy-MM-dd format'),
      endDate: z.string().describe('End date in yyyy-MM-dd format'),
    },
    ...READ_ONLY,
  })
  async getAttendanceSummary({
    startDate,
    endDate,
  }: {
    startDate: string;
    endDate: string;
  }): Promise<CallToolResult> {
    const summary = await getSummaryByDateRange(
      this.prisma,
      startDate,
      endDate,
    );
    return {
      content: [{ type: 'text', text: toJSON(summary) }],
    };
  }

  @Tool({
    name: 'get_activity_adjustment',
    description:
      'Get activity adjustments for a specific user for the week containing the given date',
    paramsSchema: {
      userId: z.string().describe('User UUID'),
      date: z
        .string()
        .describe('Any date within the target week, in yyyy-MM-dd format'),
    },
    ...READ_ONLY,
  })
  async getActivityAdjustment({
    userId,
    date,
  }: {
    userId: string;
    date: string;
  }): Promise<CallToolResult> {
    const adjustments = await getActivityAdjustment(this.prisma, userId, date);
    return {
      content: [{ type: 'text', text: toJSON(adjustments) }],
    };
  }
}
