import { env } from '@backend/env';
import { logger } from '@backend/logging';

import { getTaskQueue, startJob } from '.';
import { Mail, sendMail } from '../mail';

const queueName = 'mail';

export async function setupMailQueue() {
  getTaskQueue().work<Mail, void>(
    queueName,
    {
      teamSize: env.email.queueConcurrency,
      teamConcurrency: env.email.queueConcurrency,
    },
    async ({ data }) => {
      try {
        await sendMail(data);
      } catch (error) {
        logger.error(`Error sending mail: ${error}`);
        throw error;
      }
    }
  );
}

export async function startSendMailJob(data: Mail) {
  return startJob(queueName, data);
}
