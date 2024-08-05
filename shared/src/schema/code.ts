import { z } from 'zod';

import { Language, languages } from '../language';

export const EXPLICIT_EMPTY = '0';

const emptyValueSchema = z.literal(EXPLICIT_EMPTY);

const codeIdRegex = /^\d{0,4}$/;

export const codeId = z.string().regex(codeIdRegex);

export const codeListIdSchema = z.enum([
  'Rahoitusmalli',
  'HankeTyyppi',
  'LiittyvanHankkeenTyyppi',
  'HankkeenElinkaarentila',
  'HankkeenToimielin',
  'KohteenLaji',
  'KohteenElinkaarentila',
  'KohdeTyyppi',
  'KohteenOmaisuusLuokka',
  'KohteenToiminnallinenKayttoTarkoitus',
  'KohteenMaanomistusLaji',
  'KohteenSuhdePeruskiinteistoon',
  'Lautakunta',
  'TehtäväTyyppi',
  'TehtävänElinkaarentila',
  'AsemakaavaHanketyyppi',
  'AsemakaavaSuunnittelualue',
  'Kumppani',
  'YmpäristönsuojelunSyy',
  'KohdeKayttajaRooli',
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
      {} as { [language in Language]: z.ZodString },
    ),
  ),
});
//{ type: 'alphabetical' } | { type: 'custom'; ids: string[] }
const orderingOptionsSchema = z.object({
  type: z.enum(['alphabetical', 'custom']),
  ids: z.array(z.string()).optional(),
});

export type Code = z.infer<typeof codeSchema>;
export type CodeId = z.infer<typeof codeIdSchema>;
export type OrderingOptions = z.infer<typeof orderingOptionsSchema>;

export const codeSearchSchema = z.object({
  codeListId: codeListIdSchema,
  allowEmptySelection: z.boolean().optional(),
});
