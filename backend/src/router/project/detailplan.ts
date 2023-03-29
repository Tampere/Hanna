import { z } from 'zod';

import { getCodeText } from '@backend/components/code';
import { Mail, previewMail } from '@backend/components/mail';
import {
  getNextDetailplanId,
  getProject,
  projectUpsert,
  validateUpsertProject,
} from '@backend/components/project/detailplan';
import { startSendMailJob } from '@backend/components/taskQueue/mailQueue';
import { getUser } from '@backend/components/user';
import { getPool, sql } from '@backend/db';
import { env } from '@backend/env';
import { TRPC } from '@backend/router';

import { projectIdSchema } from '@shared/schema/project/base';
import { DbDetailplanProject, detailplanProjectSchema } from '@shared/schema/project/detailplan';

async function getNotificationMailTemplate(
  project: DbDetailplanProject
): Promise<Mail['template']> {
  // Use actual values on the template instead of IDs
  return {
    name: 'new-detailplan-project',
    parameters: {
      ...project,
      preparer: !project.preparer ? '' : (await getUser(project.preparer)).name,
      planningZone: !project.planningZone
        ? ''
        : (await getCodeText({ codeListId: 'AsemakaavaSuunnittelualue', id: project.planningZone }))
            .fi,
      signatureFrom: env.detailplan.notificationSignatureFrom,
    },
  };
}

export const createDetailplanProjectRouter = (t: TRPC) =>
  t.router({
    upsertValidate: t.procedure.input(z.any()).query(async ({ input }) => {
      return validateUpsertProject(input, null);
    }),

    upsert: t.procedure.input(detailplanProjectSchema).mutation(async ({ input, ctx }) => {
      return projectUpsert(input, ctx.user);
    }),

    get: t.procedure.input(projectIdSchema).query(async ({ input }) => {
      const { id } = input;
      return getProject(id);
    }),

    getNextDetailplanId: t.procedure.query(async () => {
      return getNextDetailplanId();
    }),

    getNotificationRecipients: t.procedure.query(async () => {
      return env.detailplan.notificationRecipients;
    }),

    previewNotificationMail: t.procedure.input(projectIdSchema).query(async ({ input }) => {
      const project = await getProject(input.id);
      return previewMail({
        template: await getNotificationMailTemplate(project),
      });
    }),

    sendNotificationMail: t.procedure
      .input(projectIdSchema.extend({ recipients: z.array(z.string()) }))
      .mutation(async ({ input }) => {
        const project = await getProject(input.id);

        return await startSendMailJob({
          to: input.recipients,
          template: await getNotificationMailTemplate(project),
        });
      }),
  });
