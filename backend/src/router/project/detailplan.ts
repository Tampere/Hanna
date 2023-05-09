import { z } from 'zod';

import { getCodeText } from '@backend/components/code';
import { Mail, previewMail } from '@backend/components/mail';
import { getMailEvents } from '@backend/components/mail/mail-event';
import {
  getNextDetailplanId,
  getProject,
  projectUpsert,
  validateUpsertProject,
} from '@backend/components/project/detailplan';
import { startSendMailJob } from '@backend/components/taskQueue/mailQueue';
import { getUser } from '@backend/components/user';
import { env } from '@backend/env';
import { TRPC } from '@backend/router';

import { projectIdSchema } from '@shared/schema/project/base';
import {
  DbDetailplanProject,
  DetailplanNotification,
  detailplanNotificationSchema,
  detailplanProjectSchema,
} from '@shared/schema/project/detailplan';

async function getNotificationMailTemplate(
  project: DbDetailplanProject,
  template: DetailplanNotification['template']
): Promise<Mail['template']> {
  // Use actual values on the template instead of IDs
  return {
    name: template,
    parameters: {
      ...project,
      preparer: !project.preparer ? '' : (await getUser(project.preparer)).name,
      planningZone: !project.planningZone
        ? ''
        : (await getCodeText({ codeListId: 'AsemakaavaSuunnittelualue', id: project.planningZone }))
            .fi,
      projectPageUrl: `${env.appUrl}/asemakaavahanke/${project.id}`,
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

    getNotificationHistory: t.procedure.input(projectIdSchema).query(async ({ input }) => {
      return await getMailEvents(input.id);
    }),

    previewNotificationMail: t.procedure
      .input(detailplanNotificationSchema)
      .query(async ({ input }) => {
        const project = await getProject(input.id);
        return previewMail({
          template: await getNotificationMailTemplate(project, input.template),
        });
      }),

    sendNotificationMail: t.procedure
      .input(detailplanNotificationSchema.extend({ recipients: z.array(z.string()) }))
      .mutation(async ({ input, ctx }) => {
        const project = await getProject(input.id);

        return await startSendMailJob({
          mail: {
            to: input.recipients,
            template: await getNotificationMailTemplate(project, input.template),
          },
          userId: ctx.user.id,
          projectId: input.id,
        });
      }),
  });
