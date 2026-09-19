import { getDatabase } from '../db/schema';

export interface ACWRData {
  ratio: number;
  acuteLoad: number;
  chronicLoad: number;
  weeklyLoads: number[]; // Last 4 weeks (oldest to newest)
}

export function calculateACWR(): ACWRData {
  const db = getDatabase();
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  const endOfDay = d.getTime();

  let chronicLoadTotal = 0;
  const weeklyLoads = [0, 0, 0, 0];

  for (let i = 0; i < 4; i++) {
    const windowEnd = endOfDay - (i * 7 * ONE_DAY);
    const windowStart = windowEnd - (7 * ONE_DAY);

    const result = db.getFirstSync<{ totalGravity: number }>(
      `SELECT SUM(normalized_difficulty * attempts) as totalGravity 
       FROM boulder_logs 
       WHERE timestamp > ? AND timestamp <= ?`,
      [windowStart, windowEnd]
    );

    const load = result?.totalGravity || 0;
    chronicLoadTotal += load;
    weeklyLoads[3 - i] = load;
  }

  const acuteLoad = weeklyLoads[3];
  const chronicLoadWeekly = chronicLoadTotal / 4;
  
  const ratio = chronicLoadWeekly > 0 ? (acuteLoad / chronicLoadWeekly) : 0;

  return {
    ratio,
    acuteLoad,
    chronicLoad: chronicLoadWeekly,
    weeklyLoads,
  };
}
