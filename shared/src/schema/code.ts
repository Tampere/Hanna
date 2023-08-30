import { z } from 'zod';

import { Language, languages } from '../language';

const codeIdRegex = /^\d{0,4}$/;

export const codeId = z.string().regex(codeIdRegex);

const codeListIdSchema = z.enum([
  'Rahoitusmalli',
  'HankeTyyppi',
  'LiittyvanHankkeenTyyppi',
  'HankkeenElinkaarentila',
  'HankkeenToimielin',
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
      {} as { [language in Language]: z.ZodString }
    )
  ),
});

export type Code = z.infer<typeof codeSchema>;
export type CodeId = z.infer<typeof codeIdSchema>;

export const codeSearchSchema = z.object({
  codeListId: codeListIdSchema,
});
