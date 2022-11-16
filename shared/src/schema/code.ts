import { z } from 'zod';

import { Language, languages } from '../language';

const codeListIdSchema = z.enum([
  'Rahoitusmalli',
  'Hanketyyppi',
  'LiittyvanHankkeenTyyppi',
  'HankkeenElinkaarentila',
  'HankkeenToimielin',
]);

export const codeSchema = z.object({
  codeListId: codeListIdSchema,
  id: z.string(),
  text: z.object(
    languages.reduce(
      (object, language) => ({ ...object, [language]: z.string() }),
      {} as { [language in Language]: z.ZodString }
    )
  ),
});

export type Code = z.infer<typeof codeSchema>;

export const codeSearchSchema = z.object({
  codeListId: codeListIdSchema,
});
