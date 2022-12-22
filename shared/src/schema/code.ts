import { z } from 'zod';

import { Language, languages } from '../language';

const codeIdRegex = /^(0[1-9]|[1-9][0-9])$/;

export const codeId = z.string().regex(codeIdRegex);

const codeListIdSchema = z.enum([
  'Rahoitusmalli',
  'Hanketyyppi',
  'LiittyvanHankkeenTyyppi',
  'HankkeenElinkaarentila',
  'HankkeenToimielin',
  'KohteenElinkaarentila',
  'KohdeTyyppi',
  'KohteenOmaisuusLuokka',
  'KohteenToiminnallinenKayttoTarkoitus',
  'KohteenMaanomistusLaji',
  'KohteenSuhdePeruskiinteistoon',
]);

export const codeIdSchema = z.object({
  codeListId: codeListIdSchema,
  id: codeId,
});

export const codeSchema = z.object({
  id: codeIdSchema,
  text: z.object(
    languages.reduce(
      (object, language) => ({ ...object, [language]: z.string() }),
      {} as { [language in Language]: z.ZodString }
    )
  ),
});

export type Code = z.infer<typeof codeSchema>;
export type CodeId = z.infer<typeof codeIdSchema>;

export const codeSearchSchema = z.object({
  codeListId: codeListIdSchema,
});
