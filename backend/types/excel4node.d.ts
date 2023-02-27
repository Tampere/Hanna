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

  export class Cell {
    string(value: string): Cell;
    date(value: Date): Cell;
    number(value: number): Cell;
    style(style: Style): Cell;
  }

  export class Worksheet {
    cell(row: number, column: number): Cell;
  }

  export class Workbook {
    constructor(options?: WorkbookOptions);
    addWorksheet(name: string): Worksheet;
    createStyle(options: StyleOptions): void;
    writeToBuffer(): Promise<Buffer>;
  }
}
