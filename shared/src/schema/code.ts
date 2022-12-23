import { z } from 'zod';

import { Language, languages } from '../language';

const codeListIdSchema = z.enum([
  'Rahoitusmalli',
  'Hanketyyppi',
  'LiittyvanHankkeenTyyppi',
  'HankkeenElinkaarentila',
  'HankkeenToimielin',
]);

export const codeIdSchema = z.object({
  codeListId: codeListIdSchema,
  id: z.string(),
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
