import { z } from 'zod';

import { previewMail } from '@backend/components/mail';
import {
  getProject,
  projectUpsert,
  validateUpsertProject,
} from '@backend/components/project/detailplan';
import { startSendMailJob } from '@backend/components/taskQueue/mailQueue';
import { env } from '@backend/env';
import { TRPC } from '@backend/router';

import { projectIdSchema } from '@shared/schema/project/base';
import { detailplanProjectSchema } from '@shared/schema/project/detailplan';

export const createDetailplanProjectRouter = (t: TRPC) =>
  t.router({
    upsertValidate: t.procedure.input(z.any()).query(async ({ input }) => {
      return validateUpsertProject(input);
    }),

    upsert: t.procedure.input(detailplanProjectSchema).mutation(async ({ input, ctx }) => {
      return projectUpsert(input, ctx.user);
    }),

    get: t.procedure.input(projectIdSchema).query(async ({ input }) => {
      const { id } = input;
      return getProject(id);
    }),

    getNotificationRecipients: t.procedure.query(async () => {
      return env.detailplan.notificationRecipients;
    }),

    previewNotificationMail: t.procedure.input(projectIdSchema).query(async ({ input }) => {
      const project = await getProject(input.id);
      return previewMail({
        template: {
          name: 'new-detailplan-project',
          parameters: {
            ...project,
            signatureFrom: env.detailplan.notificationSignatureFrom,
          },
        },
      });
    }),

    sendNotificationMail: t.procedure
      .input(projectIdSchema.extend({ recipients: z.array(z.string()) }))
      .mutation(async ({ input }) => {
        const project = await getProject(input.id);
        return await startSendMailJob({
          to: input.recipients,
          template: {
            name: 'new-detailplan-project',
            parameters: { ...project, signatureFrom: env.detailplan.notificationSignatureFrom },
          },
        });
      }),
  });
