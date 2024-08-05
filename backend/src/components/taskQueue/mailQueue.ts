import { env } from '@backend/env';
import { logger } from '@backend/logging';

import { User } from '@shared/schema/user';

import { getTaskQueue, startJob } from '.';
import { Mail, sendMail } from '../mail';

const queueName = 'mail';

interface MailJobData {
  mail: Mail;
  userId: User['id'];
  projectId?: string;
}

export async function setupMailQueue() {
  getTaskQueue().work<MailJobData>(
    queueName,
    {
      teamSize: env.email.queueConcurrency,
      teamConcurrency: env.email.queueConcurrency,
    },
    async ({ data }) => {
      try {
        await sendMail(data.mail, { userId: data.userId, projectId: data.projectId });
      } catch (error) {
        logger.error(`Error sending mail: ${error}`);
        throw error;
      }
    },
  );
}

export async function startSendMailJob(data: MailJobData) {
  return startJob(queueName, data);
}
