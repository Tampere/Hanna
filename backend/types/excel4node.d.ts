/**
 * Minimal type definitions for `excel4node`.
 *
 * Only add functions/methods/variables here when needed.
 */
declare module 'excel4node' {
  export interface WorkbookOptions {
    dateFormat?: string;
  }

  export interface StyleOptions {
    font: {
      bold: boolean;
    };
  }

  export class Column {
    setWidth(width: number): Column;
  }

  export class Row {
    setHeight(height: number): Row;
  }

  export class Cell {
    string(value: string): Cell;
    date(value: Date): Cell;
    number(value: number): Cell;
    style(style: Style): Cell;
  }

  export class Worksheet {
    cell(row: number, column: number): Cell;
    column(column: number): Column;
    row(row: number): Row;
  }

  export class Workbook {
    constructor(options?: WorkbookOptions);
    addWorksheet(name: string): Worksheet;
    createStyle(options: StyleOptions): void;
    writeToBuffer(): Promise<Buffer>;
  }
}
