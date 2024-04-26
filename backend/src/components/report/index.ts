import { Workbook, Worksheet } from 'excel4node';

import { logger } from '@backend/logging';

import { ProjectSearch } from '@shared/schema/project';

import { buildDetailplanCatalogSheet } from './detailplanProject';
import { buildInvestmentProjectReportSheet } from './investmentProject';
import { saveReportFile } from './report-file';
import { calculateTextWidth } from './text-width';

type ReportFieldValue = string | number | Date | null;
type CustomFieldType = 'currency';

// Eyeballed approximation how much the width differs from Excel width
const excelWidthFactor = 1 / 7.5;

function generateSumCell(sheet: Worksheet, rowIndex: number, columnIndex: number) {
  // Create a cell object with the numeric indices & figure out its Excel reference
  const cell = sheet.cell(rowIndex, columnIndex);
  const [cellName] = cell.excelRefs;

  // Split the Excel reference into the alphanumeric parts
  const [, column, row] = Array.from(/([A-Z]+)(\d+)/.exec(cellName) ?? []);

  // Generate a sum formula using the alphanumeric references
  cell.formula(`SUM(${column}2:${column}${Number(row) - 1})`);
  return cell;
}

/**
 * Generic function for building a worksheet into a workbook with given rows.
 */
export function buildSheet<ColumnKey extends string>({
  workbook,
  sheetTitle,
  rows,
  headers,
  types,
  sum = [],
}: {
  workbook: Workbook;
  sheetTitle: string;
  rows: readonly { [field in ColumnKey]?: ReportFieldValue }[];
  headers: { [field in ColumnKey]: string };
  types?: { [field in ColumnKey]?: CustomFieldType };
  sum?: ColumnKey[];
}) {
  if (!rows.length) {
    return;
  }

  const boldStyle = workbook.createStyle({
    font: {
      bold: true,
    },
  });

  const currencyStyle = workbook.createStyle({
    numberFormat: '#,##0.00 "€"',
  });

  const headerValues = Object.keys(rows[0]).map((key) => headers[key as ColumnKey]);

  const sheet = workbook.addWorksheet(sheetTitle);

  // Initialize column widths from the headers
  const columnWidths = headerValues.map((header) =>
    calculateTextWidth({ text: header, fontName: 'Calibri', fontSize: '12px', fontWeight: 'bold' }),
  );

  // Generate sum cells
  sum.forEach((column) => {
    const columnIndex = Object.keys(rows[0]).findIndex((key) => key === column);
    const rowIndex = rows.length + 1;
    const sumCell = generateSumCell(sheet, rowIndex + 1, columnIndex + 1);
    sumCell.style(boldStyle);
  });

  // Fill in the actual data
  rows.forEach((row, rowIndex) => {
    Object.entries<ReportFieldValue | undefined>(row).forEach(([columnKey, value], column) => {
      const isCurrencyType = types?.[columnKey as ColumnKey] === 'currency';
      const cell = sheet.cell(rowIndex + 2, column + 1);

      // Skip empty values
      if (value == null) {
        if (isCurrencyType) {
          cell.style(currencyStyle);
        }
        return;
      }

      // Write the value into the cell
      if (value instanceof Date) {
        cell.date(value);
      } else if (typeof value === 'number') {
        cell.number(value);
        if (isCurrencyType) {
          cell.style(currencyStyle);
        }
      } else {
        cell.string(value);
      }

      // Calculate the width of the cell - if it's larger than the previously widest column, replace it
      let width = calculateTextWidth({
        text: value,
        fontName: 'Calibri',
        fontSize: '12px',
        fontWeight: 'normal',
      });

      // For formatted currency fields multiply the width by a fixed ratio
      if (isCurrencyType) {
        width *= 1.5;
      }

      if (width > columnWidths[column]) {
        columnWidths[column] = width;
      }
    });
  });

  // Write header cells and set each column width
  headerValues.forEach((header, index) => {
    sheet
      .cell(1, index + 1)
      .string(header)
      .style(boldStyle);
    sheet.column(index + 1).setWidth(columnWidths[index] * excelWidthFactor);
  });

  return sheet;
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
      `Running report queries for job ${jobId} with data: ${JSON.stringify(searchParams)}`,
    );

    // Build each sheet in desired order
    await buildInvestmentProjectReportSheet(workbook, searchParams);
    await buildDetailplanCatalogSheet(workbook, searchParams);

    await saveReportFile(jobId, 'raportti.xlsx', workbook);
  } catch (error) {
    // Log and rethrow the error to make the job state failed
    logger.error(error);
    throw error;
  }
}
