import { CommonQueryMethods } from 'slonik';
import { z } from 'zod';

import { getPool, sql } from '@backend/db.js';
import { env } from '@backend/env.js';

import { lockedYearSchema } from '@shared/schema/lockedYears.js';

const LOCKED_YEARS_OPEN_HOURS = env.lockedYearsOpenHours || 24;

/**
 * Effectively locked years. A year is locked if opened_at is NULL or older than the configured
 * auto-close window (LOCKED_YEARS_OPEN_HOURS, default 24h).
 */
export async function getLockedYears(conn: Pick<CommonQueryMethods, 'any'> = getPool()) {
  const result = await conn.any(sql.type(z.object({ year: lockedYearSchema }))`
    SELECT year
    FROM app.locked_years
    WHERE opened_at IS NULL
       OR opened_at < NOW() - ${`${LOCKED_YEARS_OPEN_HOURS} hours`}::interval
    ORDER BY year
  `);
  return result.map((row) => row.year);
}
