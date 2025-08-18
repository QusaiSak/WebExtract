"use server";

import { PeriodToDateRange } from "@/lib/helper/dates";
import prisma from "@/lib/prisma";
import { Period } from "@/types/analytics";
import { ExecutionPhaseStatus } from "@/types/workflow";
import { auth } from "@clerk/nextjs/server";
import { eachDayOfInterval, format } from "date-fns";

const { COMPLETED, FAILED } = ExecutionPhaseStatus;

export async function GetDailyCreditsStats(period: Period) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not found");
  }

  const dateRange = PeriodToDateRange(period);

  // Get all execution phases in the period
  const phases = await prisma.executionPhase.findMany({
    where: {
      execution: {
        userId,
      },
      startedAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
      status: {
        in: [COMPLETED, FAILED],
      },
      creditsConsumed: {
        not: null,
      },
    },
    select: {
      status: true,
      startedAt: true,
      creditsConsumed: true,
    },
  });

  // Create a map for daily stats
  const dailyStats = new Map();

  // Initialize all dates in the period with zero values
  const allDates = eachDayOfInterval({
    start: dateRange.startDate,
    end: dateRange.endDate,
  });

  allDates.forEach((date) => {
    const dateKey = format(date, "MMM dd");
    dailyStats.set(dateKey, { successful: 0, failed: 0 });
  });

  // Accumulate credits by day and status
  phases.forEach((phase: { status: string; startedAt: Date; creditsConsumed: number | null }) => {
    const dateKey = format(phase.startedAt, "MMM dd");
    const dayStats = dailyStats.get(dateKey) || { successful: 0, failed: 0 };
    const credits = phase.creditsConsumed || 0;

    if (phase.status === COMPLETED) {
      dayStats.successful += credits;
    } else if (phase.status === FAILED) {
      dayStats.failed += credits;
    }

    dailyStats.set(dateKey, dayStats);
  });

  // Convert to array format for charts
  return Array.from(dailyStats.entries()).map(([date, stats]) => ({
    date,
    successful: stats.successful,
    failed: stats.failed,
  }));
}
