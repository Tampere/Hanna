import { Workbook } from 'excel4node';

import { getPool, sql } from '@backend/db.js';
import { logger } from '@backend/logging.js';

export async function saveReportFile(id: string, fileName: string, workbook: Workbook) {
  const buffer = await workbook.writeToBuffer();

  logger.debug(`Saving report file ${fileName} to database, ${buffer.length} bytes...`);
  const queryResult = await getPool().query(sql.untyped`
    INSERT INTO app.report_file (pgboss_job_id, report_filename, report_data)
    VALUES (${id}, ${fileName}, ${sql.binary(buffer)})
  `);

  logger.debug(`Report file ${fileName} saved to database, ${queryResult.rowCount} rows affected.`);
}
