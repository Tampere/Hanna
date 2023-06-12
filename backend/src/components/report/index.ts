import { Workbook } from 'excel4node';

import { getPool, sql } from '@backend/db';
import { logger } from '@backend/logging';

import { TranslationKey, translations } from '@shared/language';
import { ProjectSearch } from '@shared/schema/project';
import { Suffix } from '@shared/util-types';

import { buildDetailplanCatalogSheet } from './detailplanProject';
import { buildInvestmentProjectReportSheet } from './investmentProject';
import { calculateTextWidth } from './text-width';

type ReportColumnKey = Partial<Suffix<TranslationKey, 'report.columns.'>>;
type ReportFieldValue = string | number | Date | null;

// Eyeballed approximation how much the width differs from Excel width
const excelWidthFactor = 1 / 7.5;

/**
 * Generic function for building a worksheet into a workbook with given rows.
 *
 * All row keys must be defined in localizations under the prefix `"report.columns."`.
 */
export function buildSheet<ColumnKey extends ReportColumnKey>({
  workbook,
  sheetTitle,
  rows,
}: {
  workbook: Workbook;
  sheetTitle: string;
  rows: { [field in ColumnKey]?: ReportFieldValue }[];
}) {
  if (!rows.length) {
    return;
  }

  const headerStyle = workbook.createStyle({
    font: {
      bold: true,
    },
  });

  const reportFields = Object.keys(rows[0]) as ReportColumnKey[];
  const headers = reportFields.map((field) => translations['fi'][`report.columns.${field}`]);
  const worksheet = workbook.addWorksheet(sheetTitle);

  // Initialize column widths from the headers
  const columnWidths = headers.map((header) =>
    calculateTextWidth({ text: header, fontName: 'Calibri', fontSize: '12px', fontWeight: 'bold' })
  );

  headers.forEach((header, index) => {
    worksheet
      .cell(1, index + 1)
      .string(header)
      .style(headerStyle);
  });

  rows.forEach((row, rowIndex) => {
    Object.values<ReportFieldValue | undefined>(row).forEach((value, column) => {
      // Skip empty values
      if (value == null) {
        return;
      }

      // Write the value into the cell
      const cell = worksheet.cell(rowIndex + 2, column + 1);
      if (value instanceof Date) {
        cell.date(value);
      } else if (typeof value === 'number') {
        cell.number(value);
      } else {
        cell.string(value);
      }

      // Calculate the width of the cell - if it's larger than the previously widest column, replace it
      const width = calculateTextWidth({
        text: value,
        fontName: 'Calibri',
        fontSize: '12px',
        fontWeight: 'normal',
      });
      if (width > columnWidths[column]) {
        columnWidths[column] = width;
      }
    });
  });

  // Write header cells and set each column width
  headers.forEach((header, index) => {
    worksheet
      .cell(1, index + 1)
      .string(header)
      .style(headerStyle);
    worksheet.column(index + 1).setWidth(columnWidths[index] * excelWidthFactor);
  });
}

/**
 * Builds a report for given search parameters. Saves it temporarily into the database for downloading.
 * @param jobId Job ID
 * @param searchParams Search parameters
 */
export async function buildReport(jobId: string, searchParams: ProjectSearch) {
  try {
    const workbook = new Workbook({
      dateFormat: 'd.m.yyyy',
    });

    logger.debug(
      `Running report queries for job ${jobId} with data: ${JSON.stringify(searchParams)}`
    );

    // Build each sheet in desired order
    await buildInvestmentProjectReportSheet(workbook, searchParams);
    await buildDetailplanCatalogSheet(workbook, searchParams);

    const buffer = await workbook.writeToBuffer();

    logger.debug(`Saving report to database, ${buffer.length} bytes...`);
    const queryResult = await getPool().query(sql.untyped`
      INSERT INTO app.report_file (pgboss_job_id, report_filename, report_data)
      VALUES (${jobId}, 'raportti.xlsx', ${sql.binary(buffer)})
    `);
    logger.debug(`Report saved to database, ${queryResult.rowCount} rows affected.`);
  } catch (error) {
    // Log and rethrow the error to make the job state failed
    logger.error(error);
    throw error;
  }
}
