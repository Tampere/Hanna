import { Workbook, Worksheet } from 'excel4node';

import { logger } from '@backend/logging.js';

import { ProjectSearch } from '@shared/schema/project/index.js';

import { ReportColumnKey } from '../taskQueue/workTableReportQueue.js';
import { buildDetailplanCatalogSheet } from './detailplanProject.js';
import { buildInvestmentProjectReportSheet } from './investmentProject.js';
import { buildMaintenanceProjectReportSheet } from './maintenanceProject.js';
import { saveReportFile } from './report-file.js';
import { calculateTextWidth } from './text-width.js';

type ReportFieldValue = string | number | Date | null;
type CustomFieldType = 'currency';

// Eyeballed approximation how much the width differs from Excel width
const excelWidthFactor = 1 / 7.5;

const columnMaxWidth = 600;

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

function updateColumnWidths(
  current: number[],
  columnIndex: number,
  cellValue: string | number | Date,
  isCurrencyType: boolean,
  maxWidth?: number,
) {
  const columnMax = maxWidth ?? columnMaxWidth;
  const text =
    cellValue instanceof Date ? cellValue.toLocaleDateString('fi-FI') : String(cellValue);

  let width = calculateTextWidth({
    text,
    fontName: 'Calibri',
    fontSize: '12px',
    fontWeight: 'normal',
  });

  if (isCurrencyType) {
    width *= 1.5;
  }

  if (width > current[columnIndex]) {
    current[columnIndex] = width <= columnMax ? width : columnMax;
  }
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
      cell.style({ alignment: { wrapText: true, vertical: 'top' } });

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

      updateColumnWidths(columnWidths, column, value, isCurrencyType);
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

export function buildInvestmentTypeListingReportSheet({
  workbook,
  sheetTitle,
  sumRowTitle,
  rows,
}: {
  workbook: Workbook;
  sheetTitle: string;
  sumRowTitle: string;
  rows: readonly { [field in ReportColumnKey]?: ReportFieldValue }[];
}) {
  if (!rows.length) {
    return;
  }

  const boldStyle = workbook.createStyle({
    font: {
      bold: true,
    },
  });

  const typeRowStyle = workbook.createStyle({
    border: {
      bottom: { style: 'thin', color: '#c9c9c9' },
      top: { style: 'thin', color: '#c9c9c9' },
    },
  });

  const amountSumStyle = workbook.createStyle({
    font: {
      bold: true,
    },
    border: {
      top: { style: 'medium', color: '#c9c9c9' },
    },
    numberFormat: '#,##0.00 "€"',
  });

  const projectIndentStyle = workbook.createStyle({
    alignment: {
      indent: 2,
    },
  });

  const objectIndentStyle = workbook.createStyle({
    alignment: {
      indent: 4,
    },
  });

  const currencyStyle = workbook.createStyle({
    numberFormat: '#,##0.00 "€"',
  });

  const sheet = workbook.addWorksheet(sheetTitle, {
    sheetView: { showGridLines: false },
  });

  // Initialize column widths
  const columnWidths = [200, 200];

  const sheetData = rows.reduce<
    Record<string, Record<string, { [field in ReportColumnKey]?: ReportFieldValue }[]>>
  >((data, row) => {
    if (typeof row.objectType === 'string' && typeof row.projectName === 'string') {
      if (!data[row.objectType]) {
        data[row.objectType] = {};
      }
      if (data[row.objectType][row.projectName]) {
        data[row.objectType][row.projectName].push(row);
      } else {
        data[row.objectType][row.projectName] = [row];
      }
    }
    return data;
  }, {});

  let latestRowIndex = 1;
  let totalAmount = 0;
  // First group by object type
  Object.entries(sheetData).forEach(([objectType, rows]) => {
    latestRowIndex++;
    const cell = sheet.cell(latestRowIndex, 1);
    cell.string(objectType).style(boldStyle).style(typeRowStyle);
    const amountCell = sheet.cell(latestRowIndex, 2);
    const totalTypeAmount = Object.values(rows).reduce((sum, projectRows) => {
      return (
        sum +
        projectRows.reduce((projectSum, row) => {
          if (typeof row.amount === 'number') {
            return projectSum + row.amount;
          }
          return projectSum;
        }, 0)
      );
    }, 0);
    totalAmount += totalTypeAmount;
    amountCell.number(totalTypeAmount).style(currencyStyle).style(boldStyle).style(typeRowStyle);
    updateColumnWidths(columnWidths, 0, objectType, false, 1200);
    updateColumnWidths(columnWidths, 1, totalTypeAmount, true);
    // Then group by project name
    Object.entries(rows).forEach(([projectName, projectRows]) => {
      latestRowIndex++;
      const projectCell = sheet.cell(latestRowIndex, 1);
      projectCell.string(projectName).style(boldStyle).style(projectIndentStyle);

      const amountCell = sheet.cell(latestRowIndex, 2);
      const totalAmount = projectRows.reduce((sum, row) => {
        if (typeof row.amount === 'number') {
          return sum + row.amount;
        }
        return sum;
      }, 0);
      amountCell.number(totalAmount).style(currencyStyle).style(boldStyle);
      updateColumnWidths(columnWidths, 0, projectName, false, 1200);
      updateColumnWidths(columnWidths, 1, totalAmount, true);
      // Then list project objects
      projectRows.forEach((objectRow) => {
        latestRowIndex++;
        const objectNameCell = sheet.cell(latestRowIndex, 1);
        objectNameCell
          .string((objectRow.objectName as string | undefined) ?? '')
          .style(objectIndentStyle);
        const amountCell = sheet.cell(latestRowIndex, 2);
        updateColumnWidths(columnWidths, 0, objectRow.objectName ?? '', false, 1200);

        if (typeof objectRow.amount === 'number') {
          amountCell.number(objectRow.amount).style(currencyStyle);
          updateColumnWidths(columnWidths, 1, objectRow.amount, true);
        }
      });
    });
  });
  // Add amount sum at the end
  sheet
    .cell(latestRowIndex + 1, 1)
    .string(sumRowTitle)
    .style(amountSumStyle);
  sheet
    .cell(latestRowIndex + 1, 2)
    .number(totalAmount)
    .style(amountSumStyle);

  sheet.column(1).setWidth(columnWidths[0] * excelWidthFactor);
  sheet.column(2).setWidth(columnWidths[1] * excelWidthFactor);

  // Visually hide columns beyond the used ones
  for (let c = 3; c <= 5; c++) {
    sheet.column(c).setWidth(1);
  }

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
    await buildMaintenanceProjectReportSheet(workbook, searchParams);
    await buildDetailplanCatalogSheet(workbook, searchParams);

    await saveReportFile(jobId, 'raportti.xlsx', workbook);
  } catch (error) {
    // Log and rethrow the error to make the job state failed
    logger.error(error);
    throw error;
  }
}
