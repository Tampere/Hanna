import xlsx from 'node-xlsx';

import { EncodedFile } from '@shared/file';
import { DbProject } from '@shared/schema/project';

export async function buildProjectReport(projects: readonly DbProject[]): Promise<EncodedFile> {
  const buffer = xlsx.build([
    {
      name: 'Raportti',
      options: {},
      data: [
        [1, 2, 3],
        [true, false, null, 'sheetjs'],
        ['foo', 'bar', new Date('2014-02-19T14:30Z'), '0.3'],
        ['baz', null, 'qux'],
      ],
    },
  ]);
  return {
    fileName: `raportti-${Date.now()}.xlsx`,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    encoding: 'base64',
    data: buffer.toString('base64'),
  };
}
