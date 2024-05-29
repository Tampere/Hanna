import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { getCodeText } from '@backend/components/code';
import { Mail, previewMail } from '@backend/components/mail';
import { getMailEvents } from '@backend/components/mail/mail-event';
import { getPermissionContext } from '@backend/components/project/base';
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
import { createAccessMiddleware } from '@backend/router/project/base';

import { projectIdSchema } from '@shared/schema/project/base';
import {
  DbDetailplanProject,
  DetailplanNotification,
  detailplanNotificationSchema,
  detailplanProjectSchema,
} from '@shared/schema/project/detailplan';
import { hasPermission, hasWritePermission, ownsProject } from '@shared/schema/userPermissions';

async function getNotificationMailTemplate(
  project: DbDetailplanProject,
  template: DetailplanNotification['template'],
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
      projectPageUrl: `${env.appUrl}/asemakaavahanke/${project.projectId}`,
      signatureFrom: env.detailplan.notificationSignatureFrom,
    },
  };
}

export const createDetailplanProjectRouter = (t: TRPC) => {
  const withAccess = createAccessMiddleware(t);

  return t.router({
    // read only apis available to all users
    get: t.procedure.input(projectIdSchema).query(async ({ input }) => {
      const { projectId: id } = input;
      return getProject(id);
    }),

    getNextDetailplanId: t.procedure.query(async () => {
      return getNextDetailplanId();
    }),

    getNotificationRecipients: t.procedure.query(async () => {
      return env.detailplan.notificationRecipients;
    }),

    getNotificationHistory: t.procedure.input(projectIdSchema).query(async ({ input }) => {
      return await getMailEvents(input.projectId);
    }),

    previewNotificationMail: t.procedure
      .input(detailplanNotificationSchema)
      .query(async ({ input }) => {
        const project = await getProject(input.projectId);
        return previewMail({
          template: await getNotificationMailTemplate(project, input.template),
        });
      }),

    upsertValidate: t.procedure.input(z.any()).query(async ({ input }) => {
      return validateUpsertProject(input, null);
    }),

    // APIs that require write permissions

    upsert: t.procedure
      .input(
        z.object({ project: detailplanProjectSchema, keepOwnerRights: z.boolean().optional() }),
      )
      .mutation(async ({ input, ctx }) => {
        const { project, keepOwnerRights } = input;

        if (!hasPermission(ctx.user, 'detailplanProject.write') && !project.projectId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'error.insufficientPermissions' });
        }
        if (project.projectId) {
          const permissionCtx = await getPermissionContext(project.projectId);

          if (
            !hasWritePermission(ctx.user, permissionCtx) &&
            !ownsProject(ctx.user, permissionCtx)
          ) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'error.insufficientPermissions' });
          }
        }
        return await projectUpsert(project, ctx.user, keepOwnerRights);
      }),

    sendNotificationMail: t.procedure
      .input(detailplanNotificationSchema.extend({ recipients: z.array(z.string()) }))
      .use(withAccess((usr, ctx) => ownsProject(usr, ctx) || hasWritePermission(usr, ctx)))
      .mutation(async ({ input, ctx }) => {
        const project = await getProject(input.projectId);

        return await startSendMailJob({
          mail: {
            to: input.recipients,
            template: await getNotificationMailTemplate(project, input.template),
          },
          userId: ctx.user.id,
          projectId: input.projectId,
        });
      }),
  });
};
