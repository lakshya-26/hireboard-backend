import mongoose from 'mongoose';
import { APPLICATION_STATUSES, Application } from '../models/index.js';

function startOfWeekUtc(date) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function buildLast8WeeksMap() {
  const now = new Date();
  const currentWeekStart = startOfWeekUtc(now);
  const result = [];
  for (let i = 7; i >= 0; i -= 1) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setUTCDate(currentWeekStart.getUTCDate() - i * 7);
    result.push({
      weekStart: weekStart.toISOString(),
      count: 0,
    });
  }
  return result;
}

export async function getOverview(userId) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const weeks = buildLast8WeeksMap();
  const firstWeekDate = new Date(weeks[0].weekStart);

  const [raw] = await Application.aggregate([
    {
      $match: {
        userId: userObjectId,
        deletedAt: null,
      },
    },
    {
      $facet: {
        applicationsByStatus: [
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ],
        responseStats: [
          {
            $group: {
              _id: null,
              appliedCount: {
                $sum: {
                  $cond: [{ $ne: ['$status', 'Saved'] }, 1, 0],
                },
              },
              interviewCount: {
                $sum: {
                  $cond: [
                    { $in: ['$status', ['Interview', 'Offer']] },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ],
        avgResponseTime: [
          {
            $match: {
              appliedDate: { $type: 'date' },
              lastUpdated: { $type: 'date' },
            },
          },
          {
            $project: {
              responseDays: {
                $dateDiff: {
                  startDate: '$appliedDate',
                  endDate: '$lastUpdated',
                  unit: 'day',
                },
              },
            },
          },
          {
            $group: {
              _id: null,
              avgDays: { $avg: '$responseDays' },
            },
          },
        ],
        applicationsPerWeek: [
          {
            $match: {
              createdAt: { $gte: firstWeekDate },
            },
          },
          {
            $group: {
              _id: {
                $dateTrunc: {
                  date: '$createdAt',
                  unit: 'week',
                  startOfWeek: 'monday',
                },
              },
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              weekStart: '$_id',
              count: 1,
            },
          },
          { $sort: { weekStart: 1 } },
        ],
      },
    },
  ]);

  const statusMap = Object.fromEntries(APPLICATION_STATUSES.map((status) => [status, 0]));
  for (const row of raw?.applicationsByStatus ?? []) {
    if (row?._id in statusMap) {
      statusMap[row._id] = row.count;
    }
  }

  const responseStats = raw?.responseStats?.[0] ?? { appliedCount: 0, interviewCount: 0 };
  const responseRate =
    responseStats.appliedCount > 0
      ? Number(((responseStats.interviewCount / responseStats.appliedCount) * 100).toFixed(2))
      : 0;

  const avgDays = raw?.avgResponseTime?.[0]?.avgDays;
  const avgResponseTime = avgDays == null ? 0 : Number(avgDays.toFixed(2));

  const weeklyMap = new Map(
    (raw?.applicationsPerWeek ?? []).map((row) => [
      new Date(row.weekStart).toISOString(),
      row.count,
    ]),
  );
  const applicationsPerWeek = weeks.map((row) => ({
    weekStart: row.weekStart,
    count: weeklyMap.get(row.weekStart) ?? 0,
  }));

  return {
    applicationsByStatus: statusMap,
    responseRate,
    avgResponseTime,
    applicationsPerWeek,
  };
}
